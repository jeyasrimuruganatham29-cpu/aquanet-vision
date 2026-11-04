

## 🌟 Water Quality Workflow

AquaNet Vision presents an overview of water-quality monitoring and assessment:
- **Data Inputs**: Review available water-quality records and measurements.
- **Processing**: Prepare and organize records for consistent analysis.
- **Assessment**: Present water-quality indicators and risk categories.
- **Reporting**: Review results, trends, and alerts.

The public website does not present model-accuracy benchmarks.

---

## 🚀 Key Features & Pages

1. **Home**: Hero section with liquid canvas particle background, animated count-up metrics, and an interactive 4-stage pipeline infographic.
2. **Dashboard**: Real-time telemetry monitoring grid, hero WQI circular gauge, live simulation ticker, and node registry table.
3. **Water Quality Prediction Studio**: Two-column parameter studio with interactive sliders, scientific presets (Pristine Spring, Industrial Discharge, Algal Bloom, Agricultural Runoff), tensor inference simulation, Potability/WQI gauges, and SHAP feature attribution.
4. **Analytics**: Recharts visualizations for multi-parameter trends, safe tolerance threshold bands, and annual monthly comparative analyses.
5. **Water Body Map (GIS)**: Full interactive Leaflet map with custom status-coded water-drop pins, contamination heatmap overlay toggle, and slide-over deep inspection drawer.
6. **Alerts Feed**: Real-time severity-coded incident stream (Critical, Warning, Info) with resolution workflows and emergency alert broadcast simulation.
7. **Reports Builder**: Customizable section checklist, live A4 publication-grade document preview, and client-side PDF export.
8. **Settings & RBAC**: Explicit demo-role selector, analyst preferences, and administrator-only demo data/sensor controls.
9. **Emergency SMS Alerts**: Manual area-targeted alert drafts, consented recipient management, administrator verification/approval, recipient-count preview, and an SMS simulation history. Live SMS dispatch is not configured.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Leaflet, React-Leaflet, Lucide React, html2pdf |
| **Design System** | Custom Glassmorphism (`backdrop-blur-xl`), Deep Ocean & Cyan Neon palette, Dark/Light mode persistence |
| **Backend Scaffold** | Python Flask REST API with CORS, structured JSON endpoints |
| **Machine Learning** | TensorFlow / Keras for water-quality model training and inference |
| **Database** | MySQL 8.0 schema with foreign keys, spatial indices, and sample seed data |

---

## ⚡ Quick Start (Frontend)

```bash
# Navigate to the project directory
cd aquanet-vision

# Install dependencies (already installed)
npm install

# Start the Vite development server
npm run dev
```

Visit `http://localhost:5173` to explore the dashboard.

---

## 🐍 Backend API Setup (Optional)

```bash
cd backend

# Create virtual environment and activate
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Run Flask REST API
python app.py
```

The Flask API will run on `http://localhost:5000` with the following endpoints:
- `GET /api/v1/health`
- `GET /api/v1/stations`
- `POST /api/v1/predict`
- `GET /api/v1/alerts`
- `POST /api/v1/telemetry/ingest`
- `/api/v1/emergency/*` (demo-role gated)

### Emergency alert and demo-role limitations

- The selected `admin`/`analyst` role is stored in browser local storage and sent to Flask as `X-AquaNet-Demo-Role`. This is a self-asserted demo value, **not authentication**. Anyone able to make HTTP requests can claim the administrator role; do not expose this service as a secure production system.
- Dataset upload, telemetry ingest, recipient management, approval, cancellation, and simulation actions require the administrator demo role at the Flask route. Analysts can draft and view alerts, but recipient phone numbers are only returned by the administrator-gated recipient endpoint.
- Emergency alert history and consented recipients are stored in `backend/outputs/emergency_alerts.sqlite3` by default. Set `AQUANET_EMERGENCY_DB_PATH` to choose a persistent database path. `AQUANET_SMS_MAX_RECIPIENTS` controls the default per-alert cap of 100.
- The SMS workflow is simulation-only. It records `simulated` / `not_sent_simulation`; it never contacts an SMS provider or reports delivery. Live dispatch is not implemented. An attempted non-simulation mode is rejected by the API.
- There is no integrated verified weather-warning source. Alerts must be manually drafted and independently confirmed by the administrator before approval. Model predictions do not trigger alerts.
- Before any real deployment, replace demo roles with authenticated server-side identities and authorization, configure an India-supported SMS provider, and meet recipient consent, DLT registration, template, sender, and applicable regulatory requirements. Do not send tests to real recipients.

---

## 🗄️ Database Setup (MySQL)

Import the provided schema into your MySQL server:

```bash
mysql -u root -p < database/schema.sql
```
