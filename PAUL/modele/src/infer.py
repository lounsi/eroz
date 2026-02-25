"""
infer.py – Inference on BraTS2020 validation data.

Exports predicted masks as NIfTI (.nii.gz) and 3-5 axial PNG slices per patient.

Usage (PowerShell):
    python src/infer.py ^
        --data_root "BraTS2020_ValidationData/MICCAI_BraTS2020_ValidationData" ^
        --ckpt "outputs/best.pt" ^
        --out_dir "outputs/preds"
"""

import argparse
from pathlib import Path

import numpy as np
import nibabel as nib
import torch
import matplotlib

matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt
from monai.inferers import sliding_window_inference

from dataset import scan_patients
from preprocess import preprocess_patient
from model import get_model
from utils import set_seed, setup_logger


# ---------------------------------------------------------------------------
# PNG visualization
# ---------------------------------------------------------------------------

def save_slice_pngs(
    flair_vol: np.ndarray,
    pred_mask: np.ndarray,
    patient_id: str,
    out_dir: Path,
    n_slices: int = 5,
):
    """Save axial slices with FLAIR background + prediction overlay.

    Parameters
    ----------
    flair_vol : (D, H, W) float
    pred_mask : (D, H, W) binary
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    D = flair_vol.shape[0]

    # Pick slices with most predicted tumor voxels (or evenly spaced)
    tumor_per_slice = pred_mask.sum(axis=(1, 2))
    if tumor_per_slice.max() > 0:
        top_idx = np.argsort(tumor_per_slice)[::-1][:n_slices]
        top_idx = np.sort(top_idx)
    else:
        top_idx = np.linspace(D // 4, 3 * D // 4, n_slices, dtype=int)

    for i, s in enumerate(top_idx):
        fig, ax = plt.subplots(1, 1, figsize=(5, 5))
        ax.imshow(flair_vol[s].T, cmap="gray", origin="lower")
        ax.imshow(
            np.ma.masked_where(pred_mask[s].T == 0, pred_mask[s].T),
            cmap="Reds",
            alpha=0.5,
            origin="lower",
        )
        ax.set_title(f"{patient_id} – slice {s}")
        ax.axis("off")
        fig.tight_layout()
        fig.savefig(out_dir / f"{patient_id}_slice{s:03d}.png", dpi=100)
        plt.close(fig)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Inference on BraTS2020 validation")
    parser.add_argument("--data_root", type=str, required=True,
                        help="Path to MICCAI_BraTS2020_ValidationData")
    parser.add_argument("--ckpt", type=str, required=True,
                        help="Path to best.pt checkpoint")
    parser.add_argument("--out_dir", type=str, default="outputs/preds")
    parser.add_argument("--roi_size", type=int, nargs=3, default=None,
                        help="Patch size for sliding window (default: from ckpt)")
    parser.add_argument("--target_shape", type=int, nargs=3, default=None,
                        help="Preprocessing target shape (default: from ckpt)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    set_seed(args.seed)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    logger = setup_logger("brats_infer", log_dir=out_dir)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")

    # Load checkpoint
    ckpt = torch.load(args.ckpt, map_location=device, weights_only=False)
    target_shape = tuple(args.target_shape) if args.target_shape else tuple(ckpt.get("target_shape", (160, 160, 128)))
    roi_size = tuple(args.roi_size) if args.roi_size else tuple(ckpt.get("roi_size", (96, 96, 96)))
    logger.info(f"target_shape={target_shape}, roi_size={roi_size}")

    # Model
    model = get_model(in_channels=4, out_channels=1, device=device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    logger.info(f"Loaded checkpoint from epoch {ckpt.get('epoch', '?')}, "
                f"best_val_dice={ckpt.get('best_val_dice', '?')}")

    # Scan patients
    items = scan_patients(args.data_root)
    logger.info(f"Found {len(items)} patients for inference")

    for idx, item in enumerate(items, 1):
        pid = item["patient_id"]
        logger.info(f"[{idx}/{len(items)}] Processing {pid}...")

        try:
            x, _ = preprocess_patient(item, target_shape=target_shape)
        except Exception as e:
            logger.error(f"  Preprocessing failed for {pid}: {e}")
            continue

        x_tensor = torch.from_numpy(x).float().unsqueeze(0).to(device)  # (1, 4, D, H, W)

        with torch.no_grad():
            logits = sliding_window_inference(
                x_tensor, roi_size=roi_size, sw_batch_size=2,
                predictor=model, overlap=0.25,
            )
            pred_prob = torch.sigmoid(logits)
            pred_mask = (pred_prob > 0.5).squeeze().cpu().numpy().astype(np.uint8)

        # Save NIfTI prediction
        nifti_out = nib.Nifti1Image(pred_mask, affine=np.eye(4))
        nifti_path = out_dir / f"{pid}_pred.nii.gz"
        nib.save(nifti_out, str(nifti_path))
        logger.info(f"  Saved {nifti_path.name}  "
                    f"(tumor voxels: {pred_mask.sum():,})")

        # Save PNG slices (overlay on FLAIR = channel 0)
        flair_vol = x[0]  # (D, H, W)
        png_dir = out_dir / "png"
        save_slice_pngs(flair_vol, pred_mask, pid, png_dir, n_slices=5)

    logger.info("Inference complete.")


if __name__ == "__main__":
    main()
