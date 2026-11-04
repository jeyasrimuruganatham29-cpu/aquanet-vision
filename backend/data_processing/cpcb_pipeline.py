"""End-to-end CPCB data processing pipeline for AquaNet Vision.

This module loads all CPCB CSV files from the project dataset folders, cleans and
standardizes them, merges the files by the shared observation key, derives
analytics features, computes water quality scores, and saves processed outputs.
No model training is performed here.
"""

import json
import logging
import re
from pathlib import Path
from typing import Iterable, List

import numpy as np
import pandas as pd

from backend.utils.data_utils import (
    find_cpcb_files,
    impute_missing_values,
    normalize_dataframe,
    build_derived_features,
    select_numeric_columns,
)
from backend.utils.visualization_utils import (
    plot_correlation_matrix,
    plot_missing_value_heatmap,
    plot_parameter_distributions,
    plot_state_water_quality,
)

logger = logging.getLogger("AquaNetCPCBPipeline")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_ROOT = PROJECT_ROOT / "Data set"
OUTPUT_DIR = PROJECT_ROOT / "backend" / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MERGE_KEYS = [
    "state",
    "district",
    "station",
    "river",
    "latitude",
    "longitude",
    "data_acquisition_time",
]


def safe_read_csv(file_path: Path) -> pd.DataFrame:
    """Safely read a CSV file and return a dataframe with error handling."""
    try:
        return pd.read_csv(file_path, low_memory=False)
    except Exception as exc:
        logger.warning(f"Failed to read {file_path.name}: {exc}")
        return pd.DataFrame()


def _find_best_column(df: pd.DataFrame, candidates: Iterable[str]) -> str | None:
    """Find the first matching column name from a list of aliases."""
    normalized = {str(col).lower(): col for col in df.columns}
    for candidate in candidates:
        c = str(candidate).lower()
        if c in normalized:
            return normalized[c]
    for col in df.columns:
        lower = str(col).lower()
        for candidate in candidates:
            if candidate.lower() in lower:
                return col
    return None


def _normalize_value_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize values columns after the dataset has been loaded."""
    normalized = normalize_dataframe(df)

    # Make all key columns consistent for merge.
    for key in MERGE_KEYS:
        if key not in normalized.columns:
            alias_map = {
                "state": ["state", "state_name"],
                "district": ["district", "district_name"],
                "station": ["station", "station_name"],
                "river": ["river", "local_river", "river_name"],
                "latitude": ["latitude", "lat"],
                "longitude": ["longitude", "lon", "lng"],
                "data_acquisition_time": ["data_acquisition_time", "date_acquisition_time", "acquisition_time"],
            }
            alias_candidates = alias_map.get(key, [key])
            match = _find_best_column(normalized, alias_candidates)
            if match and match != key:
                normalized = normalized.rename(columns={match: key})

    return normalized


def load_all_cpcb_datasets(data_root: str | Path = None) -> dict:
    """Load and normalize all CPCB datasets from configured dataset folders."""
    root = Path(data_root) if data_root else DATASET_ROOT
    grouped_files = find_cpcb_files(root)
    loaded = {}

    for category, file_list in grouped_files.items():
        frames = []
        for file_path in file_list:
            logger.info(f"Loading dataset: {file_path.name}")
            df = safe_read_csv(file_path)
            if df.empty:
                logger.warning(f"Skipping empty file: {file_path.name}")
                continue
            df = _normalize_value_column_names(df)
            frames.append(df)
        loaded[category] = frames

    return loaded


def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicate rows while preserving a log of how many were removed."""
    initial_rows = len(df)
    cleaned = df.drop_duplicates().copy()
    removed = initial_rows - len(cleaned)
    if removed > 0:
        logger.info(f"Removed {removed} duplicate rows.")
    return cleaned


def merge_cpcb_datasets(dataset_groups: dict) -> pd.DataFrame:
    """Merge all CPCB datasets by the standard observation key.

    The CPCB files share the same spatial and temporal metadata columns, so before
    merging each additional dataframe we drop duplicate metadata columns that are
    already present in the accumulated result. This keeps only the measurement
    columns from each file while preserving the shared observation identity.
    """
    frames = []
    for category, dataset_list in dataset_groups.items():
        if not dataset_list:
            continue
        for df in dataset_list:
            frames.append(df)

    if not frames:
        raise ValueError("No CPCB data was loaded. Check the data directory.")

    merged = frames[0].copy()
    for next_df in frames[1:]:
        merge_keys = [key for key in MERGE_KEYS if key in merged.columns and key in next_df.columns]
        if not merge_keys:
            raise KeyError(f"No valid merge keys were found between datasets. Columns: {merged.columns[:10]} | {next_df.columns[:10]}")

        # Remove overlapping non-key metadata columns from the new dataframe so
        # pandas does not raise duplicate-column merge errors.
        overlapping = set(merged.columns).intersection(next_df.columns) - set(merge_keys)
        next_trimmed = next_df.drop(columns=[col for col in overlapping if col in next_df.columns], errors="ignore")

        merged = merged.merge(next_trimmed, on=merge_keys, how="outer")

    logger.info(f"Merged dataset contains {len(merged)} rows and {len(merged.columns)} columns.")
    return merged


def calculate_water_quality_score(df: pd.DataFrame) -> pd.DataFrame:
    """Compute a composite water quality score from key water condition parameters."""
    result = df.copy()

    ph_col = _find_best_column(result, ["ph", "potential_of_hydrogen", "ph_value"])
    do_col = _find_best_column(result, ["dissolved_oxygen", "dissolved_oxygen_mg_l", "d_o"])
    turbidity_col = _find_best_column(result, ["turbidity", "turbidity_ntu"])
    tds_col = _find_best_column(result, ["total_dissolved_solids", "tds", "total_dissolved_solids_mg_l"])
    bod_col = _find_best_column(result, ["biochemical_oxygen_demand", "bod", "biochemical_oxygen_demand_mg_l"])
    cod_col = _find_best_column(result, ["chemical_oxygen_demand", "cod", "chemical_oxygen_demand_mg_l"])

    def score_ph(value):
        if pd.isna(value):
            return np.nan
        return max(0, min(100, 100 - abs(float(value) - 7.0) * 20))

    def score_do(value):
        if pd.isna(value):
            return np.nan
        val = float(value)
        return max(0, min(100, (val / 9.0) * 100))

    def score_turbidity(value):
        if pd.isna(value):
            return np.nan
        val = float(value)
        return max(0, min(100, 100 - (val / 25.0) * 100))

    def score_tds(value):
        if pd.isna(value):
            return np.nan
        val = float(value)
        return max(0, min(100, 100 - (val / 600.0) * 100))

    def score_bod(value):
        if pd.isna(value):
            return np.nan
        val = float(value)
        return max(0, min(100, 100 - (val / 30.0) * 100))

    def score_cod(value):
        if pd.isna(value):
            return np.nan
        val = float(value)
        return max(0, min(100, 100 - (val / 100.0) * 100))

    score_map = {
        "ph_score": ph_col,
        "do_score": do_col,
        "turbidity_score": turbidity_col,
        "tds_score": tds_col,
        "bod_score": bod_col,
        "cod_score": cod_col,
    }

    for key, col in score_map.items():
        if col is None:
            result[key] = np.nan
            continue
        if key == "ph_score":
            result[key] = result[col].apply(score_ph)
        elif key == "do_score":
            result[key] = result[col].apply(score_do)
        elif key == "turbidity_score":
            result[key] = result[col].apply(score_turbidity)
        elif key == "tds_score":
            result[key] = result[col].apply(score_tds)
        elif key == "bod_score":
            result[key] = result[col].apply(score_bod)
        elif key == "cod_score":
            result[key] = result[col].apply(score_cod)

    quality_score_cols = [
        "ph_score",
        "do_score",
        "turbidity_score",
        "tds_score",
        "bod_score",
        "cod_score",
    ]
    result["water_quality_score"] = result[quality_score_cols].mean(axis=1, skipna=True)

    result["water_quality_class"] = pd.cut(
        result["water_quality_score"],
        bins=[-1, 20, 40, 60, 80, 101],
        labels=["Very Poor", "Poor", "Moderate", "Good", "Excellent"],
        right=True,
    )
    result["water_quality_class"] = result["water_quality_class"].astype(str)
    result["water_quality_class"] = result["water_quality_class"].replace("nan", "Unknown")
    return result


def prepare_final_dataset() -> pd.DataFrame:
    """Execute the CPCB processing pipeline and return the final merged dataframe."""
    raw_groups = load_all_cpcb_datasets(DATASET_ROOT)
    if not raw_groups:
        raise ValueError("No CPCB datasets were found.")

    cleaned_frames = []
    for category, file_list in raw_groups.items():
        for df in file_list:
            df = remove_duplicates(df)
            df = impute_missing_values(df)
            df = df.reset_index(drop=True)
            cleaned_frames.append(df)

    cleaned_df = merge_cpcb_datasets({"combined": cleaned_frames})
    cleaned_df = cleaned_df.reset_index(drop=True)
    cleaned_df.to_csv(OUTPUT_DIR / "cleaned_dataset.csv", index=False)

    processed_df = build_derived_features(cleaned_df.copy())
    processed_df = processed_df.reset_index(drop=True)
    processed_df.to_csv(OUTPUT_DIR / "processed_dataset.csv", index=False)

    water_quality_df = calculate_water_quality_score(processed_df.copy())
    water_quality_df.to_csv(OUTPUT_DIR / "water_quality_dataset.csv", index=False)

    numeric_cols = water_quality_df.select_dtypes(include=[np.number]).columns.tolist()
    plot_missing_value_heatmap(water_quality_df, OUTPUT_DIR / "missing_value_heatmap.png")
    plot_parameter_distributions(water_quality_df, numeric_cols[:8], OUTPUT_DIR / "distributions")
    plot_state_water_quality(water_quality_df, OUTPUT_DIR / "state_water_quality.png")
    plot_correlation_matrix(water_quality_df, numeric_cols[:10], OUTPUT_DIR / "correlation_matrix.png")

    logger.info(f"Processed dataset saved to {OUTPUT_DIR}")
    return water_quality_df


def run_cpcb_pipeline() -> pd.DataFrame:
    """Public entry point for the CPCB cleaning pipeline."""
    return prepare_final_dataset()


if __name__ == "__main__":
    try:
        final_df = run_cpcb_pipeline()
        print(f"Pipeline completed successfully. Final rows: {len(final_df)}")
        print(final_df.head().to_string(index=False))
    except Exception as exc:
        logger.exception(f"CPCB pipeline failed: {exc}")
        raise
