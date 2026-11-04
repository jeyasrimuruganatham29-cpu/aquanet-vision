
import tensorflow as tf
from tensorflow.keras import layers, models, Model

def build_multimodal_fusion_model(
    satellite_shape=(64, 64, 4),  # 64x64 pixel patch with 4 spectral bands (R, G, B, NIR)
    iot_sequence_shape=(24, 6),    # 24 sequential hourly readings of 6 physicochemical parameters
    num_heads=4,
    key_dim=64
):
    """
    Builds the complete end-to-end Multimodal Deep Learning Fusion Architecture.
    """
    # -------------------------------------------------------------------------
    # 1. Spatial Satellite Branch (Convolutional Feature Extractor)
    # -------------------------------------------------------------------------
    satellite_input = layers.Input(shape=satellite_shape, name="satellite_multispectral_patch")

    x_spatial = layers.Conv2D(32, (3, 3), padding="same", activation="relu")(satellite_input)
    x_spatial = layers.BatchNormalization()(x_spatial)
    x_spatial = layers.MaxPooling2D((2, 2))(x_spatial)

    x_spatial = layers.Conv2D(64, (3, 3), padding="same", activation="relu")(x_spatial)
    x_spatial = layers.BatchNormalization()(x_spatial)
    x_spatial = layers.MaxPooling2D((2, 2))(x_spatial)

    x_spatial = layers.Conv2D(128, (3, 3), padding="same", activation="relu")(x_spatial)
    x_spatial = layers.GlobalAveragePooling2D()(x_spatial)
    spatial_embeddings = layers.Dense(key_dim, activation="relu", name="spatial_embedding")(x_spatial)

    # -------------------------------------------------------------------------
    # 2. Temporal IoT Branch (Sequential Sensor Time-Series)
    # -------------------------------------------------------------------------
    iot_input = layers.Input(shape=iot_sequence_shape, name="iot_sensor_timeseries")

    x_temporal = layers.Bidirectional(layers.LSTM(64, return_sequences=True))(iot_input)
    x_temporal = layers.Dropout(0.2)(x_temporal)
    x_temporal = layers.Bidirectional(layers.LSTM(32, return_sequences=False))(x_temporal)
    temporal_embeddings = layers.Dense(key_dim, activation="relu", name="temporal_embedding")(x_temporal)

    # -------------------------------------------------------------------------
    # 3. Cross-Modal Multi-Head Attention Fusion Layer
    # -------------------------------------------------------------------------
    # Expand dimensions for attention sequence operations
    spatial_seq = layers.Reshape((1, key_dim))(spatial_embeddings)
    temporal_seq = layers.Reshape((1, key_dim))(temporal_embeddings)

    # Cross-attention: Query from IoT, Key/Value from Satellite
    cross_attention = layers.MultiHeadAttention(
        num_heads=num_heads,
        key_dim=key_dim,
        name="cross_modal_attention"
    )(query=temporal_seq, value=spatial_seq, key=spatial_seq)

    cross_attention = layers.Add()([temporal_seq, cross_attention])
    cross_attention = layers.LayerNormalization()(cross_attention)
    fused_features = layers.Flatten()(cross_attention)

    # Intermediate Dense Representation
    dense_shared = layers.Dense(128, activation="relu")(fused_features)
    dense_shared = layers.Dropout(0.25)(dense_shared)
    dense_shared = layers.Dense(64, activation="relu")(dense_shared)

    # -------------------------------------------------------------------------
    # 4. Dual Output Heads
    # -------------------------------------------------------------------------
    # Head A: WQI Regression Output (Continuous 0 - 100)
    wqi_output = layers.Dense(1, activation="linear", name="wqi_regression")(dense_shared)

    # Head B: Anomaly / Algal Bloom Detection (Binary Classification)
    anomaly_output = layers.Dense(1, activation="sigmoid", name="anomaly_classification")(dense_shared)

    model = Model(
        inputs=[satellite_input, iot_input],
        outputs=[wqi_output, anomaly_output],
        name="AquaNet_Multimodal_Transformer_Fusion"
    )

    # Compile with composite loss: MSE for regression + Binary Crossentropy for anomaly
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss={
            "wqi_regression": "mean_squared_error",
            "anomaly_classification": "binary_crossentropy"
        },
        metrics={
            "wqi_regression": ["mae", tf.keras.metrics.RootMeanSquaredError(name="rmse")],
            "anomaly_classification": ["accuracy", tf.keras.metrics.AUC(name="auc")]
        }
    )

    return model

def predict_sample(model, satellite_patch, iot_series):
    """Utility function to run batch inference."""
    wqi_pred, anomaly_pred = model.predict([satellite_patch, iot_series])
    return {
        "wqi": float(wqi_pred[0][0]),
        "anomaly_probability": float(anomaly_pred[0][0])
    }

if __name__ == "__main__":
    model = build_multimodal_fusion_model()
    model.summary()
