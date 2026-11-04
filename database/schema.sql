CREATE DATABASE IF NOT EXISTS aquanet_vision_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aquanet_vision_db;

-- 1. Water Bodies Registry
CREATE TABLE IF NOT EXISTS water_bodies (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type ENUM('Coastal Lagoon', 'Freshwater Reservoir', 'River Basin', 'Urban Lake', 'Tidal Estuary', 'Industrial Drainage') NOT NULL,
    region VARCHAR(64) NOT NULL,
    state VARCHAR(64) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    catchment_area_sqkm DECIMAL(10, 2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coords (latitude, longitude)
) ENGINE=InnoDB;

-- 2. IoT Sensor Hardware Nodes
CREATE TABLE IF NOT EXISTS sensor_nodes (
    id VARCHAR(32) PRIMARY KEY,
    water_body_id VARCHAR(32) NOT NULL,
    hardware_model VARCHAR(64) NOT NULL, -- e.g., 'ESP32 LoRa Gateway v3.1', 'NodeMCU ESP8266'
    telemetry_protocol ENUM('LoRaWAN', 'Cellular_CatM1', 'WiFi_MQTT', 'GSM_GPRS', 'Satellite_IoT') DEFAULT 'LoRaWAN',
    battery_percentage DECIMAL(5, 2) DEFAULT 100.0,
    signal_strength_dbm INT DEFAULT -70,
    status ENUM('online', 'degraded', 'offline', 'maintenance') DEFAULT 'online',
    last_calibration_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (water_body_id) REFERENCES water_bodies(id) ON DELETE CASCADE,
    INDEX idx_station (water_body_id)
) ENGINE=InnoDB;

-- 3. In-Situ IoT Sensor Telemetry (Time-Series)
CREATE TABLE IF NOT EXISTS iot_telemetry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    node_id VARCHAR(32) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    ph DECIMAL(4, 2) NOT NULL,
    turbidity_ntu DECIMAL(6, 2) NOT NULL,
    temperature_celsius DECIMAL(5, 2) NOT NULL,
    dissolved_oxygen_mg_l DECIMAL(5, 2) NOT NULL,
    tds_ppm DECIMAL(7, 2) NOT NULL,
    conductivity_us_cm DECIMAL(7, 2) NOT NULL,
    quality_status ENUM('safe', 'moderate', 'unsafe') DEFAULT 'safe',
    FOREIGN KEY (node_id) REFERENCES sensor_nodes(id) ON DELETE CASCADE,
    INDEX idx_node_time (node_id, recorded_at)
) ENGINE=InnoDB;

-- 4. Satellite Remote Sensing Observations (Sentinel-2 & Landsat)
CREATE TABLE IF NOT EXISTS satellite_observations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    water_body_id VARCHAR(32) NOT NULL,
    satellite_mission ENUM('Sentinel-2A', 'Sentinel-2B', 'Landsat-8', 'Landsat-9') NOT NULL,
    granule_tile_id VARCHAR(64) NOT NULL,
    acquisition_time TIMESTAMP NOT NULL,
    ndci_chlorophyll DECIMAL(6, 4) NOT NULL, -- Normalized Difference Chlorophyll Index
    ndti_turbidity DECIMAL(6, 4) NOT NULL,   -- Normalized Difference Turbidity Index
    ndwi_water_extent DECIMAL(6, 4) NOT NULL,-- Normalized Difference Water Index
    cloud_cover_percentage DECIMAL(5, 2) NOT NULL,
    FOREIGN KEY (water_body_id) REFERENCES water_bodies(id) ON DELETE CASCADE,
    INDEX idx_station_acquisition (water_body_id, acquisition_time)
) ENGINE=InnoDB;

-- 5. Deep Learning Model Inferences & Predictions
CREATE TABLE IF NOT EXISTS model_predictions (
    id VARCHAR(64) PRIMARY KEY,
    water_body_id VARCHAR(32) NOT NULL,
    model_architecture VARCHAR(64) NOT NULL, -- 'Multimodal Transformer v2.4' | 'CNN-BiLSTM Hybrid'
    wqi_score DECIMAL(5, 2) NOT NULL,
    potability_score INT NOT NULL,
    classification_grade VARCHAR(32) NOT NULL,
    risk_tier ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    confidence_percentage DECIMAL(5, 2) NOT NULL,
    anomaly_detected BOOLEAN DEFAULT FALSE,
    inference_latency_ms INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (water_body_id) REFERENCES water_bodies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Emergency Alerts & Incident Logs
CREATE TABLE IF NOT EXISTS alert_logs (
    id VARCHAR(32) PRIMARY KEY,
    water_body_id VARCHAR(32) NOT NULL,
    severity ENUM('info', 'warning', 'critical') NOT NULL,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    metric_breached VARCHAR(64) NOT NULL,
    status ENUM('active', 'acknowledged', 'resolved', 'dismissed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (water_body_id) REFERENCES water_bodies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Users & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    role ENUM('admin', 'analyst', 'viewer') NOT NULL DEFAULT 'analyst',
    institution VARCHAR(128) NOT NULL,
    department VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- SAMPLE SEED DATA
-- =============================================================================

INSERT INTO water_bodies (id, name, type, region, state, latitude, longitude, catchment_area_sqkm) VALUES
('st-1', 'Pulicat Lagoon Node-01', 'Coastal Lagoon', 'Coromandel Coast', 'Tamil Nadu', 13.419000, 80.320000, 759.00),
('st-2', 'Vaigai Reservoir Dam Intake', 'Freshwater Reservoir', 'Theni Basin', 'Tamil Nadu', 10.055000, 77.591000, 7014.00),
('st-3', 'Kaveri River Mettur Reach', 'River Basin', 'Salem Water Authority', 'Tamil Nadu', 11.802000, 77.801000, 42000.00),
('st-4', 'Hussain Sagar Urban Sector', 'Urban Lake', 'Hyderabad Metro', 'Telangana', 17.423000, 78.473000, 240.00),
('st-8', 'Stanley Reservoir Industrial Sector', 'Industrial Drainage', 'Salem Downstream', 'Tamil Nadu', 11.810000, 77.795000, 520.00)
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO sensor_nodes (id, water_body_id, hardware_model, telemetry_protocol, battery_percentage, signal_strength_dbm, status) VALUES
('node-01', 'st-1', 'ESP32 LoRa Gateway v3.1', 'LoRaWAN', 94.0, -68, 'online'),
('node-02', 'st-2', 'ESP32 Cellular Cat-M1', 'Cellular_CatM1', 98.0, -62, 'online'),
('node-04', 'st-4', 'NodeMCU Solar Mesh-04', 'WiFi_MQTT', 82.0, -79, 'online'),
('node-08', 'st-8', 'Industrial RTU Modbus 4G', 'Cellular_CatM1', 100.0, -58, 'online')
ON DUPLICATE KEY UPDATE hardware_model=hardware_model;

INSERT INTO users (id, full_name, email, role, institution, department) VALUES
('usr-01', 'AquaNet Operator', 'operator@aquanet.vision', 'admin', 'AquaNet Vision Operations', 'Water Intelligence'),
('usr-02', 'AquaNet Analyst', 'analyst@aquanet.vision', 'analyst', 'AquaNet Vision Operations', 'Water Intelligence')
ON DUPLICATE KEY UPDATE full_name=full_name;

-- -----------------------------------------------------------------------------
-- Additional compatibility tables requested by the dashboard and API
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS water_sensor_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    station_id VARCHAR(32) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    ph DECIMAL(4,2),
    turbidity_ntu DECIMAL(6,2),
    temperature_celsius DECIMAL(5,2),
    dissolved_oxygen_mg_l DECIMAL(5,2),
    tds_ppm DECIMAL(7,2),
    conductivity_us_cm DECIMAL(7,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES water_bodies(id) ON DELETE CASCADE,
    INDEX idx_sensor_time (station_id, recorded_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS satellite_features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    station_id VARCHAR(32) NOT NULL,
    acquisition_time TIMESTAMP NOT NULL,
    ndwi DECIMAL(6,4),
    ndci DECIMAL(6,4),
    ndti DECIMAL(6,4),
    cloud_cover DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES water_bodies(id) ON DELETE CASCADE,
    INDEX idx_sat_time (station_id, acquisition_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(64) PRIMARY KEY,
    station_id VARCHAR(32) NOT NULL,
    model_name VARCHAR(64) NOT NULL,
    wqi_score DECIMAL(5,2) NOT NULL,
    quality_class VARCHAR(32) NOT NULL,
    pollution_risk VARCHAR(16) NOT NULL,
    confidence_pct DECIMAL(5,2) NOT NULL,
    inference_time_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES water_bodies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    station_id VARCHAR(32) NOT NULL,
    severity ENUM('info','warning','critical') NOT NULL,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    metric_breached VARCHAR(64) NOT NULL,
    status ENUM('active','acknowledged','resolved','dismissed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (station_id) REFERENCES water_bodies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS model_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_key VARCHAR(64) NOT NULL,
    metric_name VARCHAR(64) NOT NULL,
    metric_value DOUBLE NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model_key (model_key)
) ENGINE=InnoDB;
