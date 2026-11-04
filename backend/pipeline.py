import os
import json
from pathlib import Path
import logging
import numpy as np
import pandas as pd

from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, precision_score, recall_score, f1_score, accuracy_score

try:
    from xgboost import XGBRegressor
    _HAS_XGB = True
except Exception:
    _HAS_XGB = False

LOG = logging.getLogger("AquaNetPipeline")
ROOT = Path(__file__).resolve().parents[1]


def _class_from_wqi(wqi: float) -> str:
    if wqi >= 80:
        return 'Excellent'
    if wqi >= 60:
        return 'Good'
    if wqi >= 40:
        return 'Moderate'
    if wqi >= 20:
        return 'Poor'
    return 'Unsafe'


def load_csv_safe(path: Path):
    if not path.exists():
        LOG.warning(f"Missing dataset: {path}")
        return None
    try:
        return pd.read_csv(path)
    except Exception as e:
        LOG.exception(f"Failed reading {path}: {e}")
        return None


def load_datasets():
    datasets_dir = ROOT / 'datasets'
    datasets_dir.mkdir(exist_ok=True)

    water = load_csv_safe(datasets_dir / 'water_quality.csv')
    sat = load_csv_safe(datasets_dir / 'satellite_features.csv')
    merged = load_csv_safe(datasets_dir / 'merged_dataset.csv')

    # If merged exists, prefer it. Otherwise attempt to merge water & sat if both available.
    if merged is not None:
        LOG.info('Loaded merged_dataset.csv')
        return merged, water, sat

    if water is not None and sat is not None:
        try:
            merged_df = pd.merge(water, sat, how='inner', on=['station_id', 'timestamp'])
            LOG.info('Merged water and satellite datasets')
            return merged_df, water, sat
        except Exception:
            LOG.exception('Failed to merge water & satellite datasets')

    # Fallback: synthesize small mock dataset
    LOG.info('Using synthesized mock dataset')
    rng = np.random.default_rng(seed=42)
    n = 512
    timestamps = pd.date_range(end=pd.Timestamp.now(), periods=n, freq='H')
    sat_ndwi = rng.normal(loc=0.1, scale=0.05, size=n)
    sat_ndci = rng.normal(loc=0.08, scale=0.04, size=n)
    sat_ndti = rng.normal(loc=0.05, scale=0.03, size=n)

    water_ph = rng.normal(loc=7.4, scale=0.4, size=n)
    water_turb = np.abs(rng.normal(loc=3.5, scale=2.5, size=n))
    water_temp = rng.normal(loc=25.5, scale=2.1, size=n)
    water_do = np.abs(rng.normal(loc=7.5, scale=1.2, size=n))
    water_tds = np.abs(rng.normal(loc=300, scale=120, size=n))
    water_cond = np.abs(rng.normal(loc=450, scale=220, size=n))

    df = pd.DataFrame({
        'timestamp': timestamps,
        'station_id': ['st-1'] * n,
        'pH': water_ph,
        'turbidity': water_turb,
        'temperature': water_temp,
        'dissolvedOxygen': water_do,
        'tds': water_tds,
        'conductivity': water_cond,
        'ndwi': sat_ndwi,
        'ndci': sat_ndci,
        'ndti': sat_ndti,
    })

    # Compute a heuristic WQI for training targets
    df['wqi'] = 100 - (np.abs(df['pH'] - 7.0) * 12) - (np.maximum(0, df['turbidity'] - 5) * 0.8) - (np.maximum(0, 6.5 - df['dissolvedOxygen']) * 8.5)
    df['wqi'] = df['wqi'].clip(5, 99)
    return df, None, None


def preprocess_features(df: pd.DataFrame, feature_cols, target_col='wqi'):
    df = df.copy()
    # Keep only numeric and requested columns
    X = df[feature_cols].astype(float)
    y = None
    if target_col in df.columns:
        y = df[target_col].astype(float)

    # Impute missing values with median
    imputer = SimpleImputer(strategy='median')
    X_imputed = imputer.fit_transform(X)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imputed)

    return X_scaled, y, {'imputer': imputer, 'scaler': scaler}


def train_and_evaluate_baselines(df: pd.DataFrame, save_path: Path = None):
    # Select features
    iot_features = ['pH', 'turbidity', 'temperature', 'dissolvedOxygen', 'tds', 'conductivity']
    sat_features = ['ndwi', 'ndci', 'ndti']
    feature_cols = iot_features + sat_features

    X, y_series, preprocessors = preprocess_features(df, feature_cols, target_col='wqi')
    if y_series is None:
        raise ValueError('No target wqi column available for training')

    y = y_series.values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    results = {}

    # Random Forest
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    results['random_forest'] = _evaluate_regression_and_classification(y_test, y_pred_rf)

    # XGBoost (optional)
    if _HAS_XGB:
        xgb = XGBRegressor(n_estimators=100, random_state=42, verbosity=0)
        xgb.fit(X_train, y_train)
        y_pred_xgb = xgb.predict(X_test)
        results['xgboost'] = _evaluate_regression_and_classification(y_test, y_pred_xgb)
    else:
        LOG.warning('xgboost not available; skipping XGBoost baseline')

    # SVR (scaled)
    svr = SVR(kernel='rbf', C=1.0)
    svr.fit(X_train, y_train)
    y_pred_svr = svr.predict(X_test)
    results['svr'] = _evaluate_regression_and_classification(y_test, y_pred_svr)

    # Save metrics
    metrics_out = {
        'summary': {
            'n_samples': int(len(df)),
            'features': feature_cols,
        },
        'models': results,
    }

    out_path = save_path or (ROOT / 'backend' / 'model_metrics.json')
    try:
        json.dump(metrics_out, open(out_path, 'w'), indent=2)
        LOG.info(f'Saved model metrics to {out_path}')
    except Exception:
        LOG.exception('Failed to save model metrics')

    # Return models' metrics dictionary
    return metrics_out


def _evaluate_regression_and_classification(y_true, y_pred):
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))

    # Convert to discrete classes for classification metrics
    y_true_cls = [ _class_from_wqi(v) for v in y_true ]
    y_pred_cls = [ _class_from_wqi(v) for v in y_pred ]

    # For precision/recall/f1, use macro to be robust across classes
    precision = precision_score(y_true_cls, y_pred_cls, average='macro', zero_division=0)
    recall = recall_score(y_true_cls, y_pred_cls, average='macro', zero_division=0)
    f1 = f1_score(y_true_cls, y_pred_cls, average='macro', zero_division=0)
    accuracy = accuracy_score(y_true_cls, y_pred_cls)

    return {
        'rmse': rmse,
        'mae': mae,
        'r2': r2,
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1),
    }


def predict_sample_from_dataframe(df_row):
    """Simple heuristic predictor that mirrors the endpoint behavior when models are absent."""
    ph = float(df_row.get('pH', 7.0))
    turbidity = float(df_row.get('turbidity', 2.0))
    temp = float(df_row.get('temperature', 25.0))
    do = float(df_row.get('dissolvedOxygen', 7.0))
    tds = float(df_row.get('tds', 250))
    conductivity = float(df_row.get('conductivity', 400))

    wqi = 100 - (abs(ph - 7.0) * 12) - (max(0, turbidity - 5) * 0.8) - (max(0, 6.5 - do) * 8.5)
    wqi = max(10, min(99, round(wqi, 1)))

    qualityClass = _class_from_wqi(wqi)

    if wqi >= 80:
        risk = 'Low'
        recommendation = 'Water quality meets WHO/CPCB drinking standards.'
    elif wqi >= 60:
        risk = 'Medium'
        recommendation = 'Acceptable for agricultural irrigation; filtration required for drinking.'
    else:
        risk = 'High'
        recommendation = 'Warning: Elevated turbidity or hypoxic DO. Immediate action recommended.'

    return {
        'wqiScore': float(wqi),
        'qualityClass': qualityClass,
        'riskLevel': risk,
        'recommendation': recommendation,
    }


if __name__ == '__main__':
    df, w, s = load_datasets()
    metrics = train_and_evaluate_baselines(df)
    print('Done. Metrics keys:', list(metrics.get('models', {}).keys()))
