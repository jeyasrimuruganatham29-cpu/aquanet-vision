"""CPCB data processing package for AquaNet Vision."""

from .cpcb_pipeline import prepare_final_dataset

run_cpcb_pipeline = prepare_final_dataset

__all__ = ["prepare_final_dataset", "run_cpcb_pipeline"]
