import json
import pickle
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer

try:
    from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
    from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.tree import DecisionTreeClassifier
except Exception as exc:  # pragma: no cover - defensive import guard
    raise RuntimeError(f"scikit-learn is required for training: {exc}")

try:
    from xgboost import XGBClassifier
except Exception:  # pragma: no cover - optional dependency
    XGBClassifier = None

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
OUTPUT_DIR = BACKEND_ROOT / "outputs"
MODEL_DIR = BACKEND_ROOT / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

METRICS_PATH = BACKEND_ROOT / "model_metrics.json"
FEATURE_IMPORTANCE_PATH = BACKEND_ROOT / "feature_importance.json"


def load_training_dataset(dataset_path: str | Path | None = None) -> pd.DataFrame:
    """Load the canonical processed CPCB dataset used for water-quality classification."""
    candidates = []
    if dataset_path is not None:
        candidates.append(Path(dataset_path))

    candidates.extend([
        OUTPUT_DIR / "water_quality_dataset.csv",
        OUTPUT_DIR / "processed_dataset.csv",
        OUTPUT_DIR / "cleaned_dataset.csv",
    ])

    for candidate in candidates:
        if candidate.exists():
            df = pd.read_csv(candidate, low_memory=False)
            if "water_quality_class" in df.columns:
                return df

    raise FileNotFoundError(
        "No water-quality training dataset found. Run the CPCB pipeline first to generate the outputs."
    )


def prepare_training_features(df: pd.DataFrame):
    """Return a feature matrix and target label vector using numeric CPCB features only."""
    frame = df.copy()
    frame["water_quality_class"] = frame["water_quality_class"].replace(["nan", "NaN", "None", "null", ""], np.nan)
    frame["water_quality_class"] = frame["water_quality_class"].astype(str).str.strip()
    frame["water_quality_class"] = frame["water_quality_class"].replace(["nan", "NaN"], np.nan)
    frame = frame[pd.notna(frame["water_quality_class"]) & frame["water_quality_class"].ne("Unknown")].copy()

    if frame.empty:
        raise ValueError("No usable class labels remain after filtering Unknown/nan records.")

    excluded = {
        "slno",
        "state_lgd_code",
        "district_lgd_code",
        "latitude",
        "longitude",
        "water_quality_score",
        "water_quality_class",
        "district_avg_year",
        "district_avg_month",
        "ph_score",
        "do_score",
        "turbidity_score",
        "tds_score",
        "bod_score",
        "cod_score",
    }

    numeric_columns = [
        col for col in frame.select_dtypes(include=[np.number]).columns.tolist()
        if col not in excluded
    ]

    if not numeric_columns:
        raise ValueError("No numeric feature columns were found for model training.")

    features = frame[numeric_columns].copy()
    for col in features.columns:
        features[col] = pd.to_numeric(features[col], errors="coerce")

    features = features.loc[:, ~features.isna().all(axis=0)]

    imputer = SimpleImputer(strategy="median")
    feature_names = features.columns.tolist()
    features = pd.DataFrame(
        imputer.fit_transform(features),
        columns=feature_names,
        index=features.index,
    )
    target = frame["water_quality_class"].copy()
    return features, target, feature_names


def _safe_model_metrics(y_true, y_pred):
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
    }


def _build_models():
    models = {
        "random_forest": RandomForestClassifier(
            n_estimators=250,
            random_state=42,
            class_weight="balanced",
            n_jobs=-1,
        ),
        "decision_tree": DecisionTreeClassifier(
            random_state=42,
            class_weight="balanced",
        ),
        "gradient_boosting": GradientBoostingClassifier(random_state=42),
    }

    if XGBClassifier is not None:
        models["xgboost"] = XGBClassifier(
            n_estimators=250,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="multi:softprob",
            eval_metric="mlogloss",
            random_state=42,
        )

    return models


def train_and_save_model_bundle() -> dict:
    """Train the classification models, select the best performer, and persist artifacts."""
    frame = load_training_dataset()
    X, y, feature_names = prepare_training_features(frame)

    label_encoder = LabelEncoder()
    encoded_target = label_encoder.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        encoded_target,
        test_size=0.2,
        random_state=42,
        stratify=encoded_target,
    )

    results = {}
    trained_models = {}

    for name, model in _build_models().items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        metrics = _safe_model_metrics(y_test, y_pred)
        results[name] = {
            "model": name,
            **metrics,
        }
        trained_models[name] = model

    best_model_name = max(results.items(), key=lambda item: item[1]["f1"])[0]
    best_model = trained_models[best_model_name]

    best_model_path = MODEL_DIR / "best_model.pkl"
    medians = {feature: float(value) for feature, value in X.median().items()}
    with best_model_path.open("wb") as handle:
        pickle.dump({
            "model": best_model,
            "feature_names": feature_names,
            "feature_medians": medians,
            "label_encoder": label_encoder,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "model_name": best_model_name,
        }, handle)

    feature_importance = []
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
        feature_importance = [
            {"feature": feature_name, "importance": float(score)}
            for feature_name, score in sorted(
                zip(feature_names, importances),
                key=lambda item: item[1],
                reverse=True,
            )
        ]

    metrics_payload = {
        "success": True,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_rows": int(len(frame)),
        "dataset_columns": int(len(frame.columns)),
        "best_model": best_model_name,
        "labels": label_encoder.classes_.tolist(),
        "models": results,
        "feature_count": len(feature_names),
    }

    METRICS_PATH.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")
    FEATURE_IMPORTANCE_PATH.write_text(
        json.dumps({"success": True, "best_model": best_model_name, "feature_importance": feature_importance[:20]}, indent=2),
        encoding="utf-8",
    )

    return metrics_payload


def load_saved_model_bundle():
    """Load the persisted best model bundle from disk."""
    bundle_path = MODEL_DIR / "best_model.pkl"
    if not bundle_path.exists():
        raise FileNotFoundError(f"Saved model bundle not found: {bundle_path}")

    with bundle_path.open("rb") as handle:
        return pickle.load(handle)


def predict_with_saved_model(payload: dict):
    """Predict a water quality class from a raw parameter dictionary using the saved model bundle."""
    bundle = load_saved_model_bundle()
    model = bundle["model"]
    feature_names = bundle["feature_names"]
    label_encoder = bundle["label_encoder"]
    feature_medians = bundle.get("feature_medians", {})

    alias_map = {
        "potential_of_hydrogen_ph": ["potential_of_hydrogen_ph", "ph", "pH"],
        "dissolved_oxygen_mg_l": ["dissolved_oxygen_mg_l", "dissolvedOxygen", "dissolved_oxygen", "do"],
        "turbidity_ntu": ["turbidity_ntu", "turbidity"],
        "temperature_c": ["temperature_c", "temperature", "temp"],
        "total_dissolved_solids_mg_l": ["total_dissolved_solids_mg_l", "tds"],
        "electric_conductivity_s_cm": ["electric_conductivity_s_cm", "conductivity"],
    }

    row = {}
    for name in feature_names:
        value = None
        for candidate in [name] + alias_map.get(name, []):
            if candidate in payload and payload[candidate] is not None:
                try:
                    value = float(payload[candidate])
                    break
                except (TypeError, ValueError):
                    continue
        if value is None:
            value = float(feature_medians.get(name, 0.0))
        row[name] = value

    features = pd.DataFrame([row], columns=feature_names)
    prediction = model.predict(features)[0]
    class_name = label_encoder.inverse_transform([prediction])[0]
    probabilities = model.predict_proba(features)[0] if hasattr(model, 'predict_proba') else []
    confidence = round(float(max(probabilities) * 100), 1) if len(probabilities) else None
    risk_by_class = {
        'Excellent': 'Low',
        'Good': 'Medium',
        'Moderate': 'Medium',
        'Poor': 'Critical',
        'Very Poor': 'Critical',
    }
    risk = risk_by_class.get(class_name)
    badge_color = {'Low': 'safe', 'Medium': 'moderate', 'Critical': 'unsafe'}.get(risk)
    return {
        "qualityClass": class_name,
        "model": bundle.get("model_name", "unknown_model"),
        "confidence": confidence,
        "wqiScore": None,
        "potabilityScore": None,
        "riskLevel": risk,
        "badgeColor": badge_color,
        "recommendation": (
            'Water quality is suitable for continued monitoring.' if risk == 'Low'
            else 'Treatment and closer monitoring are recommended before use.' if risk == 'Medium'
            else 'Immediate investigation and remediation are recommended.' if risk == 'Critical'
            else None
        ),
    }


if __name__ == "__main__":
    metrics = train_and_save_model_bundle()
    print(json.dumps(metrics, indent=2))