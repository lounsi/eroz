"""Tumor prediction using the pretrained BraTS MONAI UNet segmentation model."""
from __future__ import annotations

import sys
from pathlib import Path
from functools import lru_cache

import nibabel as nib
import numpy as np
import torch
from monai.networks.nets import UNet
from monai.inferers import sliding_window_inference

# Allow importing pipeline from sibling directory
_SERVICES_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_SERVICES_DIR))
from pipeline.pipeline import pipeline_0  # noqa: E402

_MODEL_PATH = Path(__file__).resolve().parent / "classification-model" / "best.pt"
_ROI_SIZE = (96, 96, 96)
_TUMOR_THRESHOLD = 0.5

# BraTS standard channel order for model input
_CHANNEL_ORDER = ["t1", "t1ce", "t2", "flair"]


@lru_cache(maxsize=1)
def _load_model() -> torch.nn.Module:
    model = UNet(
        spatial_dims=3,
        in_channels=4,
        out_channels=1,
        channels=(32, 64, 128, 256),
        strides=(2, 2, 2),
        num_res_units=2,
    )
    checkpoint = torch.load(str(_MODEL_PATH), map_location="cpu", weights_only=False)
    state_dict = checkpoint["model_state_dict"]
    model.load_state_dict(state_dict)
    model.eval()
    return model


def _zscore(arr: np.ndarray) -> np.ndarray:
    mask = arr > 0
    if not mask.any():
        return arr
    mean = arr[mask].mean()
    std = arr[mask].std()
    if std < 1e-8:
        return arr
    out = arr.copy()
    out[mask] = (arr[mask] - mean) / std
    return out.astype(np.float32)


def predict_tumor(
    t1_nii: nib.Nifti1Image,
    t1ce_nii: nib.Nifti1Image,
    t2_nii: nib.Nifti1Image,
    flair_nii: nib.Nifti1Image,
) -> dict:
    """
    Run tumor prediction on all 4 NIfTI modalities using the MONAI UNet.

    Returns:
        {
            "tumor_detected": bool,
            "confidence": float,
            "success": bool,
            "error": str | None,
        }
    """
    # Run pipeline_0 to canonicalize + normalize all modalities
    modalities = {
        "t1.nii": t1_nii,
        "t1ce.nii": t1ce_nii,
        "t2.nii": t2_nii,
        "flair.nii": flair_nii,
    }

    result = pipeline_0(modalities)
    if not result["success"]:
        return {
            "tumor_detected": False,
            "confidence": 0.0,
            "success": False,
            "error": result.get("error", "pipeline_0 failed"),
        }

    preprocessed = result["preprocessed"]

    # Extract arrays in BraTS channel order [T1, T1CE, T2, FLAIR], apply z-score
    arrays = []
    for key in _CHANNEL_ORDER:
        fname = f"{key}.nii"
        arr = preprocessed[fname].get_fdata(dtype=np.float32)
        arrays.append(_zscore(arr))

    # Stack → (4, X, Y, Z), add batch dim → (1, 4, X, Y, Z)
    x = np.stack(arrays, axis=0)
    tensor = torch.from_numpy(x).float().unsqueeze(0)

    model = _load_model()

    with torch.no_grad():
        output = sliding_window_inference(
            inputs=tensor,
            roi_size=_ROI_SIZE,
            sw_batch_size=1,
            predictor=model,
            overlap=0.25,
        )

    confidence = float(output.sigmoid().max().item())
    tumor_detected = confidence > _TUMOR_THRESHOLD

    return {
        "tumor_detected": tumor_detected,
        "confidence": round(confidence, 4),
        "success": True,
        "error": None,
    }
