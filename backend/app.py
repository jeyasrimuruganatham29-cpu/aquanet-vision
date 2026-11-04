import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS
import pandas as pd

try:
    from emergency_alerts import emergency_alerts_bp, require_demo_role
except ImportError:
    from backend.emergency_alerts import emergency_alerts_bp, require_demo_role

# Configure application logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("AquaNetVisionAPI")

app = Flask(__name__)
# Enable CORS for Vite frontend (typically running on localhost:5173 or production domain)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.register_blueprint(emergency_alerts_bp)

# -----------------------------------------------------------------------------
# Optional Deep Learning Model Loading (TensorFlow/Keras)
# -----------------------------------------------------------------------------
try:
    from model import build_multimodal_fusion_model, predict_sample
    MODEL = build_multimodal_fusion_model()
    logger.info("TensorFlow Multimodal Fusion Model initialized successfully.")
except Exception as e:
    logger.warning(f"TensorFlow model running in synthetic simulation mode: {e}")
    MODEL = None

# Import the new data pipeline utilities (preprocessing, baselines, mock data)
try:
    from pipeline import load_datasets, predict_sample_from_dataframe, train_and_evaluate_baselines
except Exception as e:
    # Attempt relative import
    try:
        from backend.pipeline import load_datasets, predict_sample_from_dataframe, train_and_evaluate_baselines
    except Exception:
        logger.warning(f"Pipeline utilities not available: {e}")

try:
    from ml.training import train_and_save_model_bundle, predict_with_saved_model, load_training_dataset
except Exception as exc:  # pragma: no cover - optional ML module import fail
    try:
        from backend.ml.training import train_and_save_model_bundle, predict_with_saved_model, load_training_dataset
    except Exception as exc2:
        logger.warning(f"ML training module unavailable: {exc2}")
        train_and_save_model_bundle = None
        predict_with_saved_model = None
        load_training_dataset = None


@app.route('/api/model-results', methods=['GET'])
def api_model_results():
    """Return the saved model benchmark results for the water-quality classifier."""
    metrics_path = os.path.join(os.path.dirname(__file__), 'model_metrics.json')
    if os.path.exists(metrics_path):
        try:
            return jsonify(json.load(open(metrics_path, 'r', encoding='utf-8'))), 200
        except Exception:
            logger.exception('Failed to read saved model metrics')

    try:
        payload = train_and_save_model_bundle()
        return jsonify(payload), 200
    except Exception as exc:
        logger.exception('Failed to train and persist model bundle')
        return jsonify({'success': False, 'error': str(exc)}), 500


def _processed_water_quality_frame():
    output_path = os.path.join(os.path.dirname(__file__), 'outputs', 'water_quality_dataset.csv')
    if not os.path.exists(output_path):
        return None
    return pd.read_csv(output_path, low_memory=False)


@app.route('/api/processed-summary', methods=['GET'])
def api_processed_summary():
    """Return dashboard-ready aggregates from the processed CPCB and satellite datasets."""
    try:
        frame = _processed_water_quality_frame()
        if frame is None or frame.empty:
            return jsonify({'success': False, 'error': 'Processed water-quality dataset is unavailable'}), 404

        class_counts = frame['water_quality_class'].fillna('Unknown').replace('nan', 'Unknown').value_counts()
        state_column = frame.get('state', pd.Series(dtype='object')).fillna('Unknown').astype(str)
        river_column = frame.get('river', pd.Series(dtype='object')).fillna('Unknown').astype(str)
        score = pd.to_numeric(frame.get('water_quality_score'), errors='coerce')

        state_frame = pd.DataFrame({
            'state': state_column,
            'score': score,
            'latitude': pd.to_numeric(frame.get('latitude'), errors='coerce'),
            'longitude': pd.to_numeric(frame.get('longitude'), errors='coerce'),
        })
        state_frame = state_frame.groupby('state', as_index=False).agg(
            water_quality_score=('score', 'mean'),
            records=('score', 'size'),
            latitude=('latitude', 'mean'),
            longitude=('longitude', 'mean'),
        )
        state_frame['water_quality_score'] = state_frame['water_quality_score'].round(2)
        state_frame['status'] = state_frame['water_quality_score'].apply(
            lambda value: 'safe' if value >= 80 else 'moderate' if value >= 50 else 'unsafe'
        )
        state_frame = state_frame.sort_values('water_quality_score', ascending=False, na_position='last')

        station_frame = pd.DataFrame({
            'station': frame.get('station', pd.Series(dtype='object')).fillna('Unknown').astype(str),
            'state': state_column,
            'district': frame.get('district', pd.Series(dtype='object')).fillna('Unknown').astype(str),
            'score': score,
            'latitude': pd.to_numeric(frame.get('latitude'), errors='coerce'),
            'longitude': pd.to_numeric(frame.get('longitude'), errors='coerce'),
        })
        station_frame = station_frame.dropna(subset=['latitude', 'longitude'])
        station_frame = station_frame.groupby(['station', 'state', 'district'], as_index=False).agg(
            water_quality_score=('score', 'mean'),
            latitude=('latitude', 'mean'),
            longitude=('longitude', 'mean'),
            records=('score', 'size'),
        )
        station_frame['water_quality_score'] = station_frame['water_quality_score'].round(2)
        station_frame['status'] = station_frame['water_quality_score'].apply(
            lambda value: 'safe' if value >= 80 else 'moderate' if value >= 50 else 'unsafe'
        )

        time_column = pd.to_datetime(frame.get('data_acquisition_time'), errors='coerce')
        trend_frame = pd.DataFrame({
            'date': time_column.dt.to_period('M').astype(str),
            'wqi': score,
            'ph': pd.to_numeric(frame.get('potential_of_hydrogen_ph'), errors='coerce'),
            'do': pd.to_numeric(frame.get('dissolved_oxygen_mg_l'), errors='coerce'),
            'turbidity': pd.to_numeric(frame.get('turbidity_ntu'), errors='coerce'),
            'tds': pd.to_numeric(frame.get('total_dissolved_solids_mg_l'), errors='coerce'),
            'bod': pd.to_numeric(frame.get('biochemical_oxygen_demand_mg_l'), errors='coerce'),
            'cod': pd.to_numeric(frame.get('chemical_oxygen_demand_mg_l'), errors='coerce'),
        })
        trends = trend_frame[trend_frame['date'].ne('NaT')].groupby('date', as_index=False).mean(numeric_only=True)
        trends = trends.replace({float('nan'): None}).to_dict(orient='records')

        satellite = []
        satellite_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets', 'satellite_features.csv')
        if os.path.exists(satellite_path):
            sat = pd.read_csv(satellite_path, low_memory=False)
            available = [column for column in ['station_id', 'timestamp', 'ndwi', 'ndci', 'ndti', 'latitude', 'longitude'] if column in sat.columns]
            satellite = sat[available].replace({float('nan'): None}).to_dict(orient='records')

        placeholder_values = {'', '-', 'nan', 'none', 'unknown'}
        valid_rivers = river_column[~river_column.str.strip().str.lower().isin(placeholder_values)]
        records = frame.replace({float('nan'): None}).to_dict(orient='records')

        return jsonify({
            'success': True,
            'summary': {
                'total_records': int(len(frame)),
                'states_covered': int(state_column[state_column.ne('Unknown')].nunique()),
                'districts_covered': int(frame['district'].dropna().astype(str).nunique()) if 'district' in frame.columns else 0,
                'monitoring_stations': int(frame['station'].dropna().astype(str).nunique()) if 'station' in frame.columns else 0,
                'rivers_covered': int(valid_rivers.nunique()),
                'quality_classes': {str(key): int(value) for key, value in class_counts.items()},
            },
            'states': state_frame.replace({float('nan'): None}).to_dict(orient='records'),
            'water_bodies': station_frame.replace({float('nan'): None}).to_dict(orient='records'),
            'trends': trends,
            'satellite': satellite,
            'records': records,
        }), 200
    except Exception as exc:
        logger.exception('Failed to aggregate processed water-quality data')
        return jsonify({'success': False, 'error': str(exc)}), 500


@app.route('/api/feature-importance', methods=['GET'])
def api_feature_importance():
    """Return the best model feature importance list."""
    import_path = os.path.join(os.path.dirname(__file__), 'feature_importance.json')
    if os.path.exists(import_path):
        try:
            return jsonify(json.load(open(import_path, 'r', encoding='utf-8'))), 200
        except Exception:
            logger.exception('Failed to read feature importance data')

    try:
        metrics = train_and_save_model_bundle()
        feature_payload = json.load(open(os.path.join(os.path.dirname(__file__), 'feature_importance.json'), 'r', encoding='utf-8'))
        return jsonify(feature_payload), 200
    except Exception as exc:
        logger.exception('Failed to generate feature importance snapshot')
        return jsonify({'success': False, 'error': str(exc)}), 500


# -----------------------------------------------------------------------------
@app.route('/api/v1/datasets/upload', methods=['POST'])
@require_demo_role('admin')
def upload_dataset():
    """Upload a CSV dataset to the repository `datasets/` folder for training/analysis.

    Accepts multipart/form-data with a `file` field. Saves the file under `datasets/`.
    """
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file part in request'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'success': False, 'error': 'Empty filename'}), 400

    filename = secure_filename(f.filename)
    # Ensure datasets dir at project root
    root = os.path.dirname(os.path.dirname(__file__))
    datasets_dir = os.path.join(root, 'datasets')
    os.makedirs(datasets_dir, exist_ok=True)
    dest = os.path.join(datasets_dir, filename)
    try:
        f.save(dest)
        logger.info(f"Saved uploaded dataset to {dest}")
        return jsonify({'success': True, 'path': dest, 'message': 'File saved'}), 201
    except Exception as e:
        logger.exception('Failed to save uploaded dataset')
        return jsonify({'success': False, 'error': str(e)}), 500
# REST API Endpoints
# -----------------------------------------------------------------------------

@app.route("/api/v1/health", methods=["GET"])
def health_check():
    """Health check endpoint for container orchestrators and load balancers."""
    return jsonify({
        "status": "healthy",
        "service": "AquaNet Vision REST API",
        "version": "2.4.0",
        "timestamp": datetime.utcnow().isoformat(),
        "ml_backend": "TensorFlow 2.15 (Multimodal Attention)",
        "database": "MySQL 8.0"
    }), 200


@app.route("/api/v1/stations", methods=["GET"])
def get_stations():
    """Retrieve all monitored water bodies and latest telemetry."""
    # In production, query MySQL database:
    # cursor.execute("SELECT * FROM water_bodies JOIN sensor_nodes ...")
    stations = [
        {
            "id": "st-1",
            "name": "Pulicat Lagoon Node-01",
            "type": "Coastal Lagoon",
            "region": "Coromandel Coast",
            "lat": 13.419,
            "lng": 80.320,
            "status": "safe",
            "wqi": 86.4,
            "potability_score": 78,
            "current": {
                "pH": 7.6, "turbidity": 3.8, "temperature": 26.2,
                "dissolved_oxygen": 7.4, "tds": 340, "conductivity": 520
            }
        },
        {
            "id": "st-2",
            "name": "Vaigai Reservoir Dam Intake",
            "type": "Freshwater Reservoir",
            "region": "Theni Basin",
            "lat": 10.055,
            "lng": 77.591,
            "status": "safe",
            "wqi": 94.2,
            "potability_score": 96,
            "current": {
                "pH": 7.3, "turbidity": 1.9, "temperature": 23.4,
                "dissolved_oxygen": 8.6, "tds": 165, "conductivity": 240
            }
        },
        {
            "id": "st-4",
            "name": "Hussain Sagar Urban Sector",
            "type": "Urban Lake",
            "region": "Hyderabad Metro",
            "lat": 17.423,
            "lng": 78.473,
            "status": "unsafe",
            "wqi": 41.8,
            "potability_score": 22,
            "current": {
                "pH": 8.8, "turbidity": 28.6, "temperature": 29.8,
                "dissolved_oxygen": 2.8, "tds": 890, "conductivity": 1340
            }
        }
    ]
    return jsonify({"success": True, "count": len(stations), "data": stations}), 200


@app.route("/api/v1/predict", methods=["POST"])
def predict():
    """
    Run deep learning inference on physicochemical parameters.
    Expected JSON payload:
    {
        "pH": 7.4,
        "turbidity": 3.2,
        "temperature": 24.5,
        "dissolvedOxygen": 7.8,
        "tds": 260,
        "conductivity": 410,
        "satellite_patch": optional base64 or spectral ndci/ndti
    }
    """
    payload = request.get_json()
    if not payload:
        return jsonify({"success": False, "error": "Missing JSON request body"}), 400

    try:
        ph = float(payload.get("pH", 7.0))
        turbidity = float(payload.get("turbidity", 2.0))
        temp = float(payload.get("temperature", 25.0))
        do = float(payload.get("dissolvedOxygen", 7.0))
        tds = float(payload.get("tds", 250))
        conductivity = float(payload.get("conductivity", 400))

        # Scientific WQI heuristic
        wqi = 100 - (abs(ph - 7.0) * 12) - (max(0, turbidity - 5) * 0.8) - (max(0, 6.5 - do) * 8.5)
        wqi = max(10, min(99, round(wqi, 1)))

        potability = max(5, min(98, int(wqi * 0.75 + (15 if do > 6 else -15))))

        if wqi >= 80:
            classification = "Excellent (Grade A)"
            risk = "Low"
            recommendation = "Water quality meets WHO/CPCB drinking standards."
        elif wqi >= 60:
            classification = "Moderate (Grade B/C)"
            risk = "Medium"
            recommendation = "Acceptable for agricultural irrigation; filtration required for drinking."
        else:
            classification = "Contaminated (Grade D/E)"
            risk = "Critical"
            recommendation = "Warning: Elevated turbidity or hypoxic DO. Divert municipal withdrawal."

        return jsonify({
            "success": True,
            "prediction": {
                "timestamp": datetime.utcnow().isoformat(),
                "wqiScore": wqi,
                "potabilityScore": potability,
                "qualityClass": classification,
                "riskLevel": risk,
                "recommendation": recommendation,
                "model": "WQI heuristic"
            }
        }), 200

    except ValueError as ve:
        return jsonify({"success": False, "error": f"Invalid numerical value: {ve}"}), 422


@app.route("/api/predict", methods=["POST"])
def predict_v2():
    """Unified prediction endpoint that uses the trained ML model when available and otherwise falls back to the reliable heuristic."""
    payload = request.get_json() or {}
    if not payload:
        return jsonify({"success": False, "error": "Missing JSON request body"}), 400

    try:
        try:
            result = predict_with_saved_model(payload)
            return jsonify({'success': True, 'prediction': result}), 200
        except FileNotFoundError:
            logger.info('Saved training model not found; training one on the fly before inference.')
            try:
                train_and_save_model_bundle()
            except Exception:
                logger.exception('Training the model bundle failed during prediction fallback')
            try:
                result = predict_with_saved_model(payload)
                return jsonify({'success': True, 'prediction': result}), 200
            except Exception:
                logger.exception('Saved model inference failed; falling to heuristic')

        try:
            from pipeline import predict_sample_from_dataframe as heuristic_predict
            pred = heuristic_predict(payload)
            return jsonify({'success': True, 'prediction': pred}), 200
        except Exception:
            logger.exception('Heuristic predictor unavailable')

        # Final fallback: basic calculation
        return predict()
    except Exception as e:
        logger.exception('Unhandled error in /api/predict')
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/dashboard', methods=['GET'])
def api_dashboard():
    try:
        processed = _processed_water_quality_frame()
        if processed is not None:
            station_frame = processed.groupby(['station', 'state', 'district'], as_index=False).agg(
                wqi=('water_quality_score', 'mean'),
                lat=('latitude', 'mean'),
                lng=('longitude', 'mean'),
                records=('water_quality_score', 'size'),
            )
            stations = []
            for index, row in station_frame.iterrows():
                value = float(row['wqi']) if pd.notna(row['wqi']) else 0
                stations.append({
                    'id': f"cpcb-{index}", 'name': row['station'], 'type': 'CPCB monitoring station',
                    'region': f"{row['district']}, {row['state']}", 'state': row['state'],
                    'lat': float(row['lat']), 'lng': float(row['lng']), 'wqi': round(value, 2),
                    'status': 'safe' if value >= 80 else 'moderate' if value >= 50 else 'unsafe',
                    'records': int(row['records']),
                })
            return jsonify({'success': True, 'count': len(stations), 'data': stations}), 200

        stations_resp = get_stations()
        data = stations_resp.get_json() if hasattr(stations_resp, 'get_json') else stations_resp
        return jsonify({
            'success': True,
            'summary': {
                'monitored': data.get('count', 0),
                'timestamp': datetime.utcnow().isoformat()
            },
            'stations': data.get('data', [])
        }), 200
    except Exception:
        logger.exception('Failed to build dashboard response')
        return jsonify({'success': True, 'stations': []}), 200


@app.route('/api/analytics', methods=['GET'])
def api_analytics():
    try:
        df = _processed_water_quality_frame()
        if df is None:
            return jsonify({'success': False, 'data': [], 'error': 'Processed dataset unavailable'}), 404
        records = df.replace({float('nan'): None}).to_dict(orient='records')
        return jsonify({'success': True, 'data': records}), 200
    except Exception:
        logger.exception('Failed to load analytics data')
        return jsonify({'success': True, 'data': []}), 200


@app.route('/api/model-comparison', methods=['GET'])
def api_model_comparison():
    # Return saved model metrics or compute baselines on the fly
    metrics_file = os.path.join(os.path.dirname(__file__), 'model_metrics.json')
    if os.path.exists(metrics_file):
        try:
            return jsonify(json.load(open(metrics_file))), 200
        except Exception:
            logger.exception('Failed to read model_metrics.json')

    try:
        df, w, s = load_datasets()
        metrics = train_and_evaluate_baselines(df)
        return jsonify(metrics), 200
    except Exception:
        logger.exception('Failed to compute model comparison')
        return jsonify({'success': False, 'error': 'metrics unavailable'}), 500


@app.route('/api/satellite-data', methods=['GET'])
def api_satellite_data():
    try:
        _, water, sat = load_datasets()
        if sat is not None:
            return jsonify({'success': True, 'count': len(sat), 'data': sat.to_dict(orient='records')}), 200

        # synthesize short satellite sample
        sample = [{
            'timestamp': datetime.utcnow().isoformat(),
            'station_id': 'st-1',
            'ndwi': 0.12,
            'ndci': 0.09,
            'ndti': 0.04
        }]
        return jsonify({'success': True, 'count': 1, 'data': sample}), 200
    except Exception:
        logger.exception('Failed to provide satellite data')
        return jsonify({'success': True, 'data': []}), 200


@app.route("/api/v1/alerts", methods=["GET"])
def get_alerts():
    """Fetch active and historical environmental hazard alerts."""
    return jsonify({
        "success": True,
        "unread_count": 2,
        "alerts": [
            {
                "id": "alt-1",
                "station_id": "st-8",
                "severity": "critical",
                "title": "Industrial Effluent Surge Detected",
                "timestamp": datetime.utcnow().isoformat(),
                "status": "active"
            }
        ]
    }), 200


@app.route("/api/v1/telemetry/ingest", methods=["POST"])
@require_demo_role('admin')
def ingest_telemetry():
    """Endpoint for ESP32/LoRa IoT edge nodes to push raw sensor readings."""
    data = request.get_json()
    logger.info(f"Ingested telemetry packet: {data}")
    return jsonify({"success": True, "message": "Telemetry queued for model inference"}), 201


def _datasets_root():
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), 'datasets')


def _read_csv_safe(name):
    path = os.path.join(_datasets_root(), name)
    if not os.path.exists(path):
        logger.warning(f"Dataset missing: {path}")
        return None
    try:
        return pd.read_csv(path)
    except Exception:
        logger.exception(f"Failed to read dataset: {path}")
        return None


@app.route('/api/india-overview', methods=['GET'])
def api_india_overview():
    try:
        wq_df = _processed_water_quality_frame()
        if wq_df is None:
            return jsonify({'success': False, 'summary': {}, 'recent_samples': []}), 404
        total_states = int(wq_df['state'].nunique())
        total_samples = int(len(wq_df))
        latest = wq_df.replace({float('nan'): None}).to_dict(orient='records')

        return jsonify({'success': True, 'summary': {'states': total_states, 'samples': total_samples}, 'recent_samples': latest}), 200
    except Exception:
        logger.exception('Failed to build india overview')
        return jsonify({'success': False, 'summary': {}, 'recent_samples': []}), 500


@app.route('/api/states', methods=['GET'])
def api_states():
    df = _read_csv_safe('india_states.csv')
    if df is None:
        processed = _processed_water_quality_frame()
        if processed is None:
            return jsonify({'success': True, 'count': 0, 'data': []}), 200
        data = processed.groupby('state', as_index=False).agg(
            name=('state', 'first'), records=('state', 'size'),
            water_quality_score=('water_quality_score', 'mean'),
            latitude=('latitude', 'mean'), longitude=('longitude', 'mean'),
        )
        data['id'] = data['name'].str.replace(' ', '-', regex=False)
        data['status'] = data['water_quality_score'].apply(lambda value: 'safe' if value >= 80 else 'moderate' if value >= 50 else 'unsafe')
        return jsonify({'success': True, 'count': len(data), 'data': data.replace({float('nan'): None}).to_dict(orient='records')}), 200
    # return basic fields
    records = df.to_dict(orient='records')
    return jsonify({'success': True, 'count': len(records), 'data': records}), 200


@app.route('/api/state/<state_id>', methods=['GET'])
def api_state_profile(state_id):
    states = _read_csv_safe('india_states.csv')
    rivers = _read_csv_safe('rivers_india.csv')
    lakes = _read_csv_safe('lakes_india.csv')
    wq = _read_csv_safe('water_quality.csv')
    sat = _read_csv_safe('satellite_features.csv')

    state = None
    processed = _processed_water_quality_frame()
    if processed is not None and 'state' in processed.columns:
        normalized_id = state_id.replace('-', ' ').casefold()
        matching = processed[processed['state'].astype(str).str.casefold() == normalized_id]
        if not matching.empty:
            state = {'id': state_id, 'name': matching.iloc[0]['state'], 'records': int(len(matching))}
    if states is not None:
        row = states[states['id'].str.upper() == state_id.upper()]
        if not row.empty:
            state = row.iloc[0].to_dict()

    # Filter rivers and lakes
    rivers_list = []
    if rivers is not None:
        for _, r in rivers.iterrows():
            if str(r.get('states','')).upper().find(state_id.upper()) != -1:
                rivers_list.append(r.to_dict())

    lakes_list = []
    if lakes is not None:
        for _, l in lakes.iterrows():
            if str(l.get('state','')).upper().find(state_id.upper()) != -1 or str(l.get('state','')).upper().find(state_id) != -1:
                lakes_list.append(l.to_dict())

    # Water quality stats for the state
    wq_stats = []
    if processed is not None and 'state' in processed.columns:
        state_name = state.get('name') if state else state_id
        wq_stats = processed[processed['state'].astype(str).str.casefold() == str(state_name).casefold()]
        wq_stats = wq_stats.replace({float('nan'): None}).to_dict(orient='records')

    # Satellite indicators sample
    sat_sample = []
    if sat is not None and 'station_id' in sat.columns:
        sat_sample = sat.to_dict(orient='records')

    return jsonify({'success': True, 'state': state or {}, 'rivers': rivers_list, 'lakes': lakes_list, 'water_quality': wq_stats, 'satellite': sat_sample}), 200


@app.route('/api/rivers', methods=['GET'])
def api_rivers():
    r = _read_csv_safe('rivers_india.csv')
    if r is None:
        return jsonify({'success': True, 'count': 0, 'data': []}), 200
    return jsonify({'success': True, 'count': len(r), 'data': r.to_dict(orient='records')}), 200


@app.route('/api/lakes', methods=['GET'])
def api_lakes():
    l = _read_csv_safe('lakes_india.csv')
    if l is None:
        return jsonify({'success': True, 'count': 0, 'data': []}), 200
    return jsonify({'success': True, 'count': len(l), 'data': l.to_dict(orient='records')}), 200


@app.route('/api/water-quality', methods=['GET'])
def api_water_quality():
    wq = _processed_water_quality_frame()
    if wq is None:
        return jsonify({'success': True, 'count': 0, 'data': []}), 200
    return jsonify({'success': True, 'count': len(wq), 'data': wq.to_dict(orient='records')}), 200



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting AquaNet Vision Flask API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
