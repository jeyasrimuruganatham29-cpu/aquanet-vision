"""Utilities for CPCB dataset validation, standardization, and cleaning."""

import logging
import re
from pathlib import Path
from typing import Iterable, List, Sequence

import numpy as np
import pandas as pd

logger = logging.getLogger("AquaNetDataUtils")


def standardize_column_name(column_name: str) -> str:
    """Convert a column name to a normalized, machine-friendly form."""
    if column_name is None:
        return ""

    cleaned = str(column_name).strip().lower()
    cleaned = cleaned.replace("%", "percent")
    cleaned = re.sub(r"[^a-z0-9]+", "_", cleaned)
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned


def standardize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Apply consistent column normalization for a dataframe."""
    renamed = df.copy()
    renamed.columns = [standardize_column_name(col) for col in renamed.columns]
    return renamed


def find_cpcb_files(data_root: str | Path) -> dict:
    """Scan the CPCB dataset folders and return files grouped by category."""
    root = Path(data_root)
    if not root.exists():
        raise FileNotFoundError(f"Dataset root not found: {root}")

    folder_names = [
        "chemical parameters",
        "physical parameters",
        "biological parameters",
        "biological problem",
    ]
    grouped_files = {}

    for folder_name in folder_names:
        folder_path = root / folder_name
        if folder_path.exists():
            csv_files = sorted(folder_path.glob("*.csv"))
            grouped_files[folder_name] = csv_files

    if not grouped_files:
        raise FileNotFoundError(f"No CPCB CSV folders found under: {root}")

    return grouped_files


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Standardize a dataframe, remove obvious empty rows, and normalize identifiers."""
    if df is None or df.empty:
        return df

    normalized = standardize_column_names(df.copy())

    for col in list(normalized.columns):
        if col.endswith("_id") or col in {"slno"}:
            normalized[col] = pd.to_numeric(normalized[col], errors="coerce")

    normalized = normalized.replace(["nan", "NaN", "N/A", "n/a", ""], np.nan)
    normalized = normalized.dropna(how="all")
    return normalized


def impute_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Impute missing numerical columns with median and categorical with mode."""
    if df is None or df.empty:
        return df

    result = df.copy()

    for column in result.columns:
        series = result[column]
        if pd.api.types.is_numeric_dtype(series):
            median_value = series.median()
            result[column] = series.fillna(median_value)
        else:
            mode_value = series.mode(dropna=True)
            if not mode_value.empty:
                result[column] = series.fillna(mode_value.iloc[0])
            else:
                result[column] = series.fillna("unknown")

    return result


def build_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add date-derived fields and aggregate summary columns."""
    if df is None or df.empty:
        return df

    result = df.copy()

    time_cols = [
        "data_acquisition_time",
        "date_acquisition_time",
        "acquisition_time",
        "sample_date",
    ]
    time_col = next((col for col in time_cols if col in result.columns), None)

    if time_col:
        result[time_col] = pd.to_datetime(result[time_col], errors="coerce")
        result["year"] = result[time_col].dt.year
        result["month"] = result[time_col].dt.month
        result["season"] = result[time_col].dt.month.map(
            {
                12: "Winter",
                1: "Winter",
                2: "Winter",
                3: "Summer",
                4: "Summer",
                5: "Summer",
                6: "Monsoon",
                7: "Monsoon",
                8: "Monsoon",
                9: "Post-Monsoon",
                10: "Post-Monsoon",
                11: "Post-Monsoon",
            }
        )

    numeric_cols = result.select_dtypes(include=[np.number]).columns.tolist()
    if "state" in result.columns:
        state_means = result.groupby("state")[numeric_cols].transform("mean")
        state_means.columns = [f"state_avg_{col}" for col in numeric_cols]
        result = pd.concat([result, state_means], axis=1)

    if "district" in result.columns:
        district_means = result.groupby("district")[numeric_cols].transform("mean")
        district_means.columns = [f"district_avg_{col}" for col in numeric_cols]
        result = pd.concat([result, district_means], axis=1)

    return result


def select_numeric_columns(df: pd.DataFrame, keywords: Sequence[str]) -> List[str]:
    """Return columns whose names match a keyword list."""
    lower_cols = [col.lower() for col in df.columns]
    matches = []
    for keyword in keywords:
        keyword_l = keyword.lower()
        for col in lower_cols:
            if keyword_l in col and col not in matches:
                matches.append(df.columns[lower_cols.index(col)])
    return matches
