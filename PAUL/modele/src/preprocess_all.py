"""
preprocess_all.py – Prétraitement offline de TOUS les patients BraTS2020.

Pré-traite chaque patient (pipeline_0 + pipeline_1) et sauvegarde le résultat
en fichiers .npz compressés.  L'entraînement charge ensuite ces fichiers
directement → beaucoup plus rapide et plus compact.

Usage :
    python src/preprocess_all.py \
        --data_root "BraTS2020_TrainingData/MICCAI_BraTS2020_TrainingData" \
        --out_dir "data_preprocessed/train" \
        --target_shape 160 160 128

    python src/preprocess_all.py \
        --data_root "BraTS2020_ValidationData/MICCAI_BraTS2020_ValidationData" \
        --out_dir "data_preprocessed/val" \
        --target_shape 160 160 128
"""

import argparse
import time
from pathlib import Path

import numpy as np

from dataset import scan_patients
from preprocess import preprocess_patient


def main():
    parser = argparse.ArgumentParser(
        description="Preprocess all BraTS patients and save as .npz"
    )
    parser.add_argument(
        "--data_root", type=str, required=True,
        help="Root directory containing patient folders"
    )
    parser.add_argument(
        "--out_dir", type=str, required=True,
        help="Output directory for preprocessed .npz files"
    )
    parser.add_argument(
        "--target_shape", type=int, nargs=3, default=[160, 160, 128],
        help="Target spatial shape (D H W)"
    )
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    target_shape = tuple(args.target_shape)

    items = scan_patients(args.data_root)
    print(f"\n{'='*60}")
    print(f"  Preprocessing {len(items)} patients")
    print(f"  target_shape = {target_shape}")
    print(f"  output dir   = {out_dir}")
    print(f"{'='*60}\n")

    success = 0
    errors = 0
    total_raw_bytes = 0
    total_npz_bytes = 0

    for i, item in enumerate(items, 1):
        pid = item["patient_id"]
        t0 = time.time()

        try:
            x, y = preprocess_patient(item, target_shape=target_shape)
        except Exception as e:
            print(f"  [{i}/{len(items)}] ERREUR {pid}: {e}")
            errors += 1
            continue

        # Binarize seg if present (tumor = 1, background = 0)
        if y is not None:
            y = (y > 0).astype(np.uint8)

        # Save compressed
        out_path = out_dir / f"{pid}.npz"
        if y is not None:
            np.savez_compressed(out_path, x=x, y=y)
        else:
            np.savez_compressed(out_path, x=x)

        # Stats
        raw_size = x.nbytes + (y.nbytes if y is not None else 0)
        npz_size = out_path.stat().st_size
        total_raw_bytes += raw_size
        total_npz_bytes += npz_size
        ratio = npz_size / raw_size * 100

        elapsed = time.time() - t0
        print(
            f"  [{i}/{len(items)}] {pid} | "
            f"x={x.shape} | "
            f"raw={raw_size/1e6:.1f}MB → npz={npz_size/1e6:.1f}MB ({ratio:.0f}%) | "
            f"{elapsed:.1f}s"
        )
        success += 1

    print(f"\n{'='*60}")
    print(f"  Terminé : {success} OK, {errors} erreurs")
    print(f"  Taille brute totale : {total_raw_bytes/1e9:.2f} GB")
    print(f"  Taille .npz totale  : {total_npz_bytes/1e9:.2f} GB")
    if total_raw_bytes > 0:
        print(f"  Compression         : {total_npz_bytes/total_raw_bytes*100:.0f}%")
    print(f"  Fichiers dans       : {out_dir}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
