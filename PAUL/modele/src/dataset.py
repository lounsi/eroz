"""
dataset.py – scan patient directories, build items, patient-level split,
             and PyTorch Dataset for BraTS2020.
"""

import os
import sys
from pathlib import Path
from typing import Optional

import numpy as np
import torch
from torch.utils.data import Dataset

# ---------------------------------------------------------------------------
# Modality detection
# ---------------------------------------------------------------------------
REQUIRED_MODALITIES = ("flair", "t1", "t1ce", "t2")


def _suffix_of(filename: str) -> str:
    """Return the modality suffix from a BraTS filename.

    Example: 'BraTS20_Training_001_t1ce.nii' -> 't1ce'
    """
    stem = filename.lower()
    for ext in (".nii.gz", ".nii"):
        if stem.endswith(ext):
            stem = stem[: -len(ext)]
            break
    return stem.rsplit("_", 1)[-1]


def scan_patients(root: str | Path) -> list[dict]:
    """Walk patient directories and build a list of items.

    Each item is a dict::

        {
            "patient_id": str,
            "patient_dir": Path,
            "modalities": {"flair": Path, "t1": Path, "t1ce": Path, "t2": Path},
            "seg_path": Path | None,
        }
    """
    root = Path(root)
    if not root.is_dir():
        raise FileNotFoundError(f"Training root not found: {root}")

    items = []
    for patient_dir in sorted(root.iterdir()):
        if not patient_dir.is_dir():
            continue

        modalities: dict[str, Path] = {}
        seg_path: Optional[Path] = None

        for f in sorted(patient_dir.iterdir()):
            if not f.is_file():
                continue
            suffix = _suffix_of(f.name)
            if suffix == "seg":
                seg_path = f
            elif suffix in REQUIRED_MODALITIES:
                modalities[suffix] = f

        # Check that all 4 modalities are present
        missing = [m for m in REQUIRED_MODALITIES if m not in modalities]
        if missing:
            print(
                f"[WARNING] Patient {patient_dir.name}: missing modalities "
                f"{missing} – SKIPPED.",
                file=sys.stderr,
            )
            continue

        items.append(
            {
                "patient_id": patient_dir.name,
                "patient_dir": patient_dir,
                "modalities": modalities,
                "seg_path": seg_path,
            }
        )

    print(f"[INFO] Found {len(items)} valid patients in {root}")
    return items


# ---------------------------------------------------------------------------
# Patient-level split
# ---------------------------------------------------------------------------


def split_patients(
    items: list[dict],
    train_ratio: float = 0.8,
    val_ratio: float = 0.2,
    seed: int = 42,
) -> tuple[list[dict], list[dict]]:
    """Split patient items into train / val sets (no data leakage)."""
    rng = np.random.RandomState(seed)
    indices = rng.permutation(len(items))

    n_train = int(len(items) * train_ratio)

    train_items = [items[i] for i in indices[:n_train]]
    val_items = [items[i] for i in indices[n_train:]]

    print(f"[INFO] Split: {len(train_items)} train, {len(val_items)} val")
    return train_items, val_items


# ---------------------------------------------------------------------------
# PyTorch Dataset
# ---------------------------------------------------------------------------


class BraTSDataset(Dataset):
    """Lazy-load BraTS2020 dataset.

    Each __getitem__ returns::
        x: torch.float32  (4, D, H, W)
        y: torch.float32  (1, D, H, W)   tumor=1, background=0
           or -1 tensor if seg is unavailable (inference mode)
    """

    def __init__(
        self,
        items: list[dict],
        target_shape: tuple[int, int, int] = (160, 160, 128),
        preprocess_fn=None,
    ):
        self.items = items
        self.target_shape = target_shape
        self.preprocess_fn = preprocess_fn

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, idx: int):
        item = self.items[idx]

        if self.preprocess_fn is not None:
            x, y = self.preprocess_fn(item, target_shape=self.target_shape)
        else:
            raise RuntimeError("preprocess_fn must be provided to BraTSDataset")

        x = torch.from_numpy(x).float()  # (4, D, H, W)

        if y is not None:
            # Binarize: any tumor label (1,2,4) -> 1
            y = (y > 0).astype(np.float32)
            y = torch.from_numpy(y).float().unsqueeze(0)  # (1, D, H, W)
        else:
            y = torch.tensor(-1.0)  # placeholder for inference

        return x, y, item["patient_id"]


# ---------------------------------------------------------------------------
# Preprocessed Dataset (loads .npz files from preprocess_all.py)
# ---------------------------------------------------------------------------


def scan_preprocessed(npz_dir: str | Path) -> list[dict]:
    """Scan a directory of .npz files and return items compatible with split_patients."""
    npz_dir = Path(npz_dir)
    if not npz_dir.is_dir():
        raise FileNotFoundError(f"Preprocessed dir not found: {npz_dir}")

    items = []
    for f in sorted(npz_dir.glob("*.npz")):
        items.append({
            "patient_id": f.stem,
            "npz_path": f,
        })

    print(f"[INFO] Found {len(items)} preprocessed .npz files in {npz_dir}")
    return items


class BraTSPreprocessedDataset(Dataset):
    """Fast dataset that loads pre-saved .npz files.

    Each __getitem__ returns::
        x: torch.float32  (4, D, H, W)
        y: torch.float32  (1, D, H, W)   tumor=1, background=0
           or -1 tensor if seg key is absent
    """

    def __init__(self, items: list[dict]):
        self.items = items

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, idx: int):
        item = self.items[idx]
        data = np.load(item["npz_path"])

        x = torch.from_numpy(data["x"]).float()  # (4, D, H, W)

        if "y" in data:
            y = torch.from_numpy(data["y"]).float().unsqueeze(0)  # (1, D, H, W)
        else:
            y = torch.tensor(-1.0)

        return x, y, item["patient_id"]
