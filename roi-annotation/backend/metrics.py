import numpy as np
import cv2
from typing import Tuple, Dict

def to_binary(mask: np.ndarray) -> np.ndarray:
    """Convertit un array en masque binaire {0,1} (uint8)."""
    if mask.dtype != np.uint8 and mask.dtype != np.bool_:
        # seuil standard : > 0 -> 1
        bin_mask = (mask > 0).astype(np.uint8)
    else:
        bin_mask = (mask > 0).astype(np.uint8)
    return bin_mask

def compute_confusion_masks(pred: np.ndarray, ref: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Retourne (tp_mask, fp_mask, fn_mask, tn_mask) comme uint8 {0,1}.
    pred, ref doivent être binaire (0/1).
    """
    pred_b = to_binary(pred)
    ref_b = to_binary(ref)
    tp = (pred_b & ref_b).astype(np.uint8)
    fp = (pred_b & (1 - ref_b)).astype(np.uint8)
    fn = ((1 - pred_b) & ref_b).astype(np.uint8)
    tn = ((1 - pred_b) & (1 - ref_b)).astype(np.uint8)
    return tp, fp, fn, tn

def dice_score(pred: np.ndarray, ref: np.ndarray) -> float:
    pred_b = to_binary(pred)
    ref_b = to_binary(ref)
    inter = np.sum(pred_b & ref_b)
    total = np.sum(pred_b) + np.sum(ref_b)
    if total == 0:
        return 1.0
    return 2.0 * inter / total

def iou_score(pred: np.ndarray, ref: np.ndarray) -> float:
    pred_b = to_binary(pred)
    ref_b = to_binary(ref)
    inter = np.sum(pred_b & ref_b)
    union = np.sum(pred_b | ref_b)
    if union == 0:
        return 1.0
    return inter / union

def precision_recall(pred: np.ndarray, ref: np.ndarray) -> Tuple[float, float]:
    pred_b = to_binary(pred)
    ref_b = to_binary(ref)
    tp = np.sum(pred_b & ref_b)
    fp = np.sum(pred_b & (1 - ref_b))
    fn = np.sum((1 - pred_b) & ref_b)
    prec = tp / (tp + fp) if (tp + fp) > 0 else 1.0 if (tp + fn)==0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 1.0 if (tp + fp)==0 else 0.0
    return prec, rec

def compute_all_metrics(pred: np.ndarray, ref: np.ndarray) -> Dict:
    pred_b = to_binary(pred)
    ref_b = to_binary(ref)
    tp_mask, fp_mask, fn_mask, tn_mask = compute_confusion_masks(pred_b, ref_b)
    tp = int(np.sum(tp_mask))
    fp = int(np.sum(fp_mask))
    fn = int(np.sum(fn_mask))
    tn = int(np.sum(tn_mask))
    prec, rec = precision_recall(pred_b, ref_b)
    dice = dice_score(pred_b, ref_b)
    iou = iou_score(pred_b, ref_b)
    return {
        "precision": float(prec),
        "recall": float(rec),
        "dice": float(dice),
        "iou": float(iou),
        "tp": tp, "fp": fp, "fn": fn, "tn": tn
    }

def overlay_diff(pred: np.ndarray, ref: np.ndarray, background: np.ndarray = None, alpha: float = 0.6) -> np.ndarray:
    """
    Génère une image RGB (uint8) où :
      - TP = vert (0,255,0)
      - FP = rouge (255,0,0)
      - FN = bleu (0,0,255)
    Si background fourni (H,W,3) on blend, sinon fond noir.
    """
    tp, fp, fn, _ = compute_confusion_masks(pred, ref)
    h, w = tp.shape
    if background is None:
        bg = np.zeros((h, w, 3), dtype=np.uint8)
    else:
        if background.shape[:2] != (h, w):
            # si taille différente, redimensionner background
            background = cv2.resize(background, (w, h), interpolation=cv2.INTER_LINEAR)
        bg = background.copy()
        if bg.dtype != np.uint8:
            bg = (255 * (bg - bg.min()) / (bg.max() - bg.min() + 1e-8)).astype(np.uint8)

    overlay = bg.copy()
    # apply colors (BGR for OpenCV)
    # FP -> red
    overlay[fp == 1] = (0, 0, 255)
    # FN -> blue
    overlay[fn == 1] = (255, 0, 0)
    # TP -> green
    overlay[tp == 1] = (0, 255, 0)

    # blend: result = alpha * overlay + (1-alpha) * bg
    result = (alpha * overlay + (1 - alpha) * bg).astype(np.uint8)
    return result