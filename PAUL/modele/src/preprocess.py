"""
preprocess.py – wrapper around pipeline_service.pipeline_0 + pipeline_1.

Loads NIfTI files for one patient, runs the full preprocessing pipeline,
and returns (x, y) numpy arrays ready for the model.
"""

import sys
from pathlib import Path
from typing import Optional

import nibabel as nib
import numpy as np

# Import pipeline_service from parent directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import pipeline_service as ps


def preprocess_patient(
    item: dict,
    target_shape: tuple[int, int, int] = (160, 160, 128),
) -> tuple[np.ndarray, Optional[np.ndarray]]:
    """Preprocess a single patient.

    Parameters
    ----------
    item : dict
        As produced by ``dataset.scan_patients``, with keys
        ``modalities`` (dict[str, Path]) and ``seg_path`` (Path | None).
    target_shape : tuple
        Target spatial shape (D, H, W) for cropping + padding.

    Returns
    -------
    x : np.ndarray  (4, D, H, W) float32
    y : np.ndarray  (D, H, W) float32 or None
    """
    patient_id = item["patient_id"]

    # 1) Load all NIfTI files into a dict {filename: nib.Nifti1Image}
    modalities_dict: dict[str, nib.Nifti1Image] = {}
    for mod_name, mod_path in item["modalities"].items():
        try:
            modalities_dict[mod_path.name] = nib.load(str(mod_path))
        except Exception as e:
            raise RuntimeError(
                f"[{patient_id}] Failed to load {mod_name} at {mod_path}: {e}"
            )

    if item["seg_path"] is not None:
        try:
            modalities_dict[item["seg_path"].name] = nib.load(str(item["seg_path"]))
        except Exception as e:
            raise RuntimeError(
                f"[{patient_id}] Failed to load seg at {item['seg_path']}: {e}"
            )

    # 2) pipeline_0:  canonicalize orientation + resample + normalize intensity
    result_p0 = ps.pipeline_0(
        modalities=modalities_dict,
        template_ref_bool=False,  # use default 1mm iso resampling
        allowed_modality_types=None,  # process all modalities
    )

    if result_p0.get("preprocessed") is None:
        error = result_p0.get("error", "Unknown error in pipeline_0")
        raise RuntimeError(f"[{patient_id}] pipeline_0 failed: {error}")

    preprocessed = result_p0["preprocessed"]

    # 3) pipeline_1:  crop + pad + stack 4 channels
    result_p1 = ps.pipeline_1(
        modalities=preprocessed,
        target_shape=target_shape,
        margins=(10, 10, 10),
        threshold=0,
        z_score_bool=False,  # already normalized in pipeline_0
        allowed_modality_types=None,
    )

    # pipeline_1 returns dict {"x": ..., "y": ..., "meta": ...} on success
    # or (None, None, meta) on failure
    if isinstance(result_p1, tuple):
        # failure case
        meta = result_p1[2] if len(result_p1) > 2 else {}
        error = meta.get("error", "Unknown error in pipeline_1")
        raise RuntimeError(f"[{patient_id}] pipeline_1 failed: {error}")

    x = result_p1["x"]   # (4, D, H, W) float32
    y = result_p1["y"]   # (D, H, W) or None

    # 4) Enforce exact target_shape via center-crop / pad
    #    pipeline_1 only pads when smaller; if the cropped volume is larger
    #    than target_shape we need to center-crop it down.
    x = _center_crop_or_pad_4d(x, target_shape)
    if y is not None:
        y = _center_crop_or_pad_3d(y.astype(np.float32), target_shape)

    return x, y


# ---------------------------------------------------------------------------
# Shape helpers
# ---------------------------------------------------------------------------

def _center_crop_or_pad_3d(
    vol: np.ndarray,
    target: tuple[int, int, int],
) -> np.ndarray:
    """Center-crop and/or pad a (D, H, W) volume to exactly *target*."""
    result = np.zeros(target, dtype=vol.dtype)
    for ax in range(3):
        src_size = vol.shape[ax]
        tgt_size = target[ax]
        if src_size > tgt_size:
            start = (src_size - tgt_size) // 2
            vol = np.take(vol, range(start, start + tgt_size), axis=ax)
    # Now vol may still be smaller on some axes → center-pad into result
    slices_src = []
    slices_dst = []
    for ax in range(3):
        s = vol.shape[ax]
        t = target[ax]
        if s >= t:
            slices_src.append(slice(0, t))
            slices_dst.append(slice(0, t))
        else:
            pad = (t - s) // 2
            slices_src.append(slice(0, s))
            slices_dst.append(slice(pad, pad + s))
    result[tuple(slices_dst)] = vol[tuple(slices_src)]
    return result


def _center_crop_or_pad_4d(
    vol: np.ndarray,
    target: tuple[int, int, int],
) -> np.ndarray:
    """Center-crop/pad a (C, D, H, W) array on spatial dims."""
    C = vol.shape[0]
    out = np.zeros((C, *target), dtype=vol.dtype)
    for c in range(C):
        out[c] = _center_crop_or_pad_3d(vol[c], target)
    return out
