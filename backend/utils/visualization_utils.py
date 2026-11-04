"""Visualization utilities for dataset quality assessment and water quality summaries."""

import logging
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

logger = logging.getLogger("AquaNetCharts")


def plot_missing_value_heatmap(df: pd.DataFrame, save_path: Path) -> None:
    """Save a missing-value heatmap for the cleaned dataframe."""
    try:
        plt.figure(figsize=(16, 10))
        sns.heatmap(df.isna(), cbar=False, cmap="viridis")
        plt.title("Missing Value Heatmap")
        plt.tight_layout()
        plt.savefig(save_path, dpi=200)
        plt.close()
    except Exception as exc:
        logger.warning(f"Unable to generate missing-value heatmap: {exc}")


def plot_parameter_distributions(df: pd.DataFrame, numeric_cols: list, save_dir: Path) -> None:
    """Create a distribution plot for each numeric parameter."""
    if not numeric_cols:
        return

    save_dir.mkdir(parents=True, exist_ok=True)
    for col in numeric_cols:
        try:
            plt.figure(figsize=(8, 5))
            sns.histplot(df[col].dropna(), kde=True, bins=30)
            plt.title(f"Distribution of {col}")
            plt.tight_layout()
            plt.savefig(save_dir / f"{col}_distribution.png", dpi=200)
            plt.close()
        except Exception as exc:
            logger.warning(f"Unable to plot {col}: {exc}")


def plot_state_water_quality(df: pd.DataFrame, save_path: Path) -> None:
    """Create a state-wise water quality bar chart."""
    try:
        if "state" not in df.columns or "water_quality_score" not in df.columns:
            return
        summary = df.groupby("state", as_index=False)["water_quality_score"].mean()
        plt.figure(figsize=(12, 8))
        sns.barplot(data=summary, x="water_quality_score", y="state", palette="viridis")
        plt.title("State-wise Average Water Quality Score")
        plt.tight_layout()
        plt.savefig(save_path, dpi=200)
        plt.close()
    except Exception as exc:
        logger.warning(f"Unable to generate state chart: {exc}")


def plot_correlation_matrix(df: pd.DataFrame, numeric_cols: list, save_path: Path) -> None:
    """Plot a correlation matrix for numeric columns."""
    try:
        corr = df[numeric_cols].corr(numeric_only=True)
        plt.figure(figsize=(14, 12))
        sns.heatmap(corr, annot=False, cmap="coolwarm", center=0)
        plt.title("Correlation Matrix")
        plt.tight_layout()
        plt.savefig(save_path, dpi=200)
        plt.close()
    except Exception as exc:
        logger.warning(f"Unable to generate correlation heatmap: {exc}")
