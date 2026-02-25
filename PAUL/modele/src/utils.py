"""
utils.py – seed, logging, metrics helpers for BraTS2020 segmentation.
"""

import logging
import os
import random
import sys
from pathlib import Path

import numpy as np
import torch


# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------

def set_seed(seed: int = 42) -> None:
    """Set random seed for reproducibility across random, numpy, torch."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    os.environ["PYTHONHASHSEED"] = str(seed)


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def setup_logger(
    name: str = "brats",
    log_dir: str | Path | None = None,
    level: int = logging.INFO,
) -> logging.Logger:
    """Create a logger that writes to console + optional file."""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.handlers.clear()

    fmt = logging.Formatter(
        "[%(asctime)s] %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(level)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # File
    if log_dir is not None:
        log_dir = Path(log_dir)
        log_dir.mkdir(parents=True, exist_ok=True)
        fh = logging.FileHandler(log_dir / "train.log", encoding="utf-8")
        fh.setLevel(level)
        fh.setFormatter(fmt)
        logger.addHandler(fh)

    return logger


# ---------------------------------------------------------------------------
# Metrics  (binary: tumor vs background)
# ---------------------------------------------------------------------------

def dice_score(pred: torch.Tensor, target: torch.Tensor, eps: float = 1e-7) -> float:
    """Compute Dice coefficient for binary masks (values 0/1).
    Both tensors should be the same shape and already binarized.
    """
    pred_flat = pred.contiguous().view(-1).float()
    tgt_flat = target.contiguous().view(-1).float()
    intersection = (pred_flat * tgt_flat).sum()
    return float((2.0 * intersection + eps) / (pred_flat.sum() + tgt_flat.sum() + eps))


def iou_score(pred: torch.Tensor, target: torch.Tensor, eps: float = 1e-7) -> float:
    """Compute IoU (Jaccard) for binary masks."""
    pred_flat = pred.contiguous().view(-1).float()
    tgt_flat = target.contiguous().view(-1).float()
    intersection = (pred_flat * tgt_flat).sum()
    union = pred_flat.sum() + tgt_flat.sum() - intersection
    return float((intersection + eps) / (union + eps))


def precision_recall(
    pred: torch.Tensor, target: torch.Tensor, eps: float = 1e-7
) -> tuple[float, float]:
    """Compute precision and recall for binary masks."""
    pred_flat = pred.contiguous().view(-1).float()
    tgt_flat = target.contiguous().view(-1).float()
    tp = (pred_flat * tgt_flat).sum()
    precision = float((tp + eps) / (pred_flat.sum() + eps))
    recall = float((tp + eps) / (tgt_flat.sum() + eps))
    return precision, recall


def hausdorff_95(
    pred: np.ndarray, target: np.ndarray, voxel_spacing: tuple = (1.0, 1.0, 1.0)
) -> float:
    """Compute 95th-percentile Hausdorff distance.

    Falls back to NaN if either mask is empty or scipy is unavailable.
    """
    try:
        from scipy.ndimage import distance_transform_edt
    except ImportError:
        return float("nan")

    pred_bool = pred.astype(bool)
    tgt_bool = target.astype(bool)

    if not pred_bool.any() or not tgt_bool.any():
        return float("nan")

    # Surface voxels (erosion trick)
    from scipy.ndimage import binary_erosion

    struct = np.ones((3, 3, 3), dtype=bool)
    pred_surface = pred_bool ^ binary_erosion(pred_bool, structure=struct)
    tgt_surface = tgt_bool ^ binary_erosion(tgt_bool, structure=struct)

    if not pred_surface.any() or not tgt_surface.any():
        return float("nan")

    # Distance from each surface voxel of A to surface of B
    dt_pred = distance_transform_edt(~tgt_surface, sampling=voxel_spacing)
    dt_tgt = distance_transform_edt(~pred_surface, sampling=voxel_spacing)

    d_pred_to_tgt = dt_pred[pred_surface]
    d_tgt_to_pred = dt_tgt[tgt_surface]

    all_dists = np.concatenate([d_pred_to_tgt, d_tgt_to_pred])
    return float(np.percentile(all_dists, 95))


def compute_all_metrics(
    pred: torch.Tensor,
    target: torch.Tensor,
    voxel_spacing: tuple = (1.0, 1.0, 1.0),
) -> dict:
    """Compute all binary metrics and return as a dict."""
    pred_bin = (pred > 0.5).long()
    tgt_bin = (target > 0.5).long()

    prec, rec = precision_recall(pred_bin, tgt_bin)
    metrics = {
        "dice": dice_score(pred_bin, tgt_bin),
        "iou": iou_score(pred_bin, tgt_bin),
        "precision": prec,
        "recall": rec,
    }

    # HD95 (on CPU numpy)
    try:
        hd = hausdorff_95(
            pred_bin.cpu().numpy(),
            tgt_bin.cpu().numpy(),
            voxel_spacing=voxel_spacing,
        )
        metrics["hd95"] = hd
    except Exception:
        metrics["hd95"] = float("nan")

    return metrics
