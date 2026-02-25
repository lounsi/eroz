"""
visualize.py – Visualise BraTS2020 data and/or predictions.

Usage:
  # Visualiser les données brutes d'un patient :
  python src/visualize.py --patient_dir "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData/BraTS20_Training_001"

  # Visualiser une prédiction vs ground truth :
  python src/visualize.py --patient_dir "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData/BraTS20_Training_001" --pred_path "outputs/preds/BraTS20_Training_001_pred.nii.gz"
"""

import argparse
from pathlib import Path

import nibabel as nib
import numpy as np
import matplotlib

matplotlib.use("TkAgg")  # interactive backend for display
import matplotlib.pyplot as plt


def load_volume(path: Path) -> np.ndarray:
    """Load NIfTI and return float32 array."""
    return nib.load(str(path)).get_fdata(dtype=np.float32)


def find_modality(patient_dir: Path, suffix: str) -> Path | None:
    """Find the file in a patient dir that ends with _<suffix>.nii."""
    for f in patient_dir.iterdir():
        stem = f.name.lower().replace(".nii.gz", "").replace(".nii", "")
        if stem.rsplit("_", 1)[-1] == suffix.lower():
            return f
    return None


def visualize_patient(patient_dir: Path, pred_path: Path | None = None, n_slices: int = 5):
    """Show axial slices of all 4 modalities + seg + optional prediction."""
    modalities = {}
    for mod in ("flair", "t1", "t1ce", "t2"):
        p = find_modality(patient_dir, mod)
        if p is not None:
            modalities[mod] = load_volume(p)

    seg_path = find_modality(patient_dir, "seg")
    seg = load_volume(seg_path) if seg_path else None

    pred = None
    if pred_path and Path(pred_path).exists():
        pred = load_volume(Path(pred_path))

    # Reference volume for shape
    ref = next(iter(modalities.values()))
    D = ref.shape[2]  # axial = last dim typically

    # Pick slices with most tumor (or evenly spaced)
    if seg is not None:
        tumor_per_slice = (seg > 0).sum(axis=(0, 1))
        if tumor_per_slice.max() > 0:
            top_idx = np.argsort(tumor_per_slice)[::-1][:n_slices]
            top_idx = np.sort(top_idx)
        else:
            top_idx = np.linspace(D // 4, 3 * D // 4, n_slices, dtype=int)
    else:
        top_idx = np.linspace(D // 4, 3 * D // 4, n_slices, dtype=int)

    # Build grid
    n_cols = len(modalities) + (1 if seg is not None else 0) + (1 if pred is not None else 0)
    headers = list(modalities.keys())
    if seg is not None:
        headers.append("GT Seg")
    if pred is not None:
        headers.append("Prediction")

    fig, axes = plt.subplots(n_slices, n_cols, figsize=(3 * n_cols, 3 * n_slices))
    if n_slices == 1:
        axes = axes[np.newaxis, :]

    fig.suptitle(f"{patient_dir.name}", fontsize=14, fontweight="bold")

    for row, s in enumerate(top_idx):
        col = 0
        for mod_name, vol in modalities.items():
            ax = axes[row, col]
            ax.imshow(vol[:, :, s].T, cmap="gray", origin="lower")
            if row == 0:
                ax.set_title(mod_name.upper(), fontsize=10)
            ax.set_ylabel(f"z={s}", fontsize=8)
            ax.set_xticks([])
            ax.set_yticks([])
            col += 1

        if seg is not None:
            ax = axes[row, col]
            ax.imshow(modalities["flair"][:, :, s].T, cmap="gray", origin="lower")
            seg_overlay = np.ma.masked_where(seg[:, :, s].T == 0, seg[:, :, s].T)
            ax.imshow(seg_overlay, cmap="jet", alpha=0.6, origin="lower", vmin=0, vmax=4)
            if row == 0:
                ax.set_title("GT Seg", fontsize=10)
            ax.set_xticks([])
            ax.set_yticks([])
            col += 1

        if pred is not None:
            ax = axes[row, col]
            ax.imshow(modalities["flair"][:, :, s].T, cmap="gray", origin="lower")
            pred_overlay = np.ma.masked_where(pred[:, :, s].T == 0, pred[:, :, s].T)
            ax.imshow(pred_overlay, cmap="Reds", alpha=0.6, origin="lower")
            if row == 0:
                ax.set_title("Prediction", fontsize=10)
            ax.set_xticks([])
            ax.set_yticks([])

    plt.tight_layout()
    plt.show()


def main():
    parser = argparse.ArgumentParser(description="Visualize BraTS patient data")
    parser.add_argument("--patient_dir", type=str, required=True,
                        help="Path to a patient folder (e.g. BraTS20_Training_001)")
    parser.add_argument("--pred_path", type=str, default=None,
                        help="Optional: path to predicted .nii.gz mask")
    parser.add_argument("--n_slices", type=int, default=5,
                        help="Number of axial slices to display")
    args = parser.parse_args()

    visualize_patient(
        patient_dir=Path(args.patient_dir),
        pred_path=Path(args.pred_path) if args.pred_path else None,
        n_slices=args.n_slices,
    )


if __name__ == "__main__":
    main()
