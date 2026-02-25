"""
train.py – Training loop for BraTS2020 binary tumour segmentation.

Usage (PowerShell):
    python src/train.py `
        --preprocessed_dir "data_preprocessed/train" `
        --epochs 100 --roi_size 96 96 96 --batch_size 1
"""

import argparse
import time
from pathlib import Path

import torch
from torch.utils.data import DataLoader
from monai.inferers import sliding_window_inference
from monai.losses import DiceLoss

from dataset import split_patients, scan_preprocessed, BraTSPreprocessedDataset
from model import get_model
from utils import set_seed, setup_logger, compute_all_metrics


# ---------------------------------------------------------------------------
# Collate – handles variable patient_id strings
# ---------------------------------------------------------------------------

def collate_fn(batch):
    xs, ys, pids = zip(*batch)
    xs = torch.stack(xs, dim=0)
    ys = torch.stack(ys, dim=0)
    return xs, ys, list(pids)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Train 3D U-Net on BraTS2020")
    parser.add_argument("--preprocessed_dir", type=str, required=True,
                        help="Path to preprocessed .npz dir (from preprocess_all.py)")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch_size", type=int, default=1)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--roi_size", type=int, nargs=3, default=[96, 96, 96],
                        help="Patch size for sliding window (D H W)")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out_dir", type=str, default="outputs")
    parser.add_argument("--patience", type=int, default=15,
                        help="Early stopping patience (epochs)")
    parser.add_argument("--sample_pct", type=float, default=1.0,
                        help="Fraction of patients to use (for debugging)")
    parser.add_argument("--num_workers", type=int, default=0,
                        help="DataLoader workers (0 = main process)")
    args = parser.parse_args()

    # Setup -----------------------------------------------------------
    set_seed(args.seed)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    logger = setup_logger("brats", log_dir=out_dir)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")
    if device.type == "cuda":
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")

    roi_size = tuple(args.roi_size)

    # Data ------------------------------------------------------------
    logger.info(f"Loading preprocessed data from {args.preprocessed_dir}")
    items = scan_preprocessed(args.preprocessed_dir)

    if args.sample_pct < 1.0:
        n = max(1, int(len(items) * args.sample_pct))
        items = items[:n]
        logger.info(f"Using {n} patients (sample_pct={args.sample_pct})")

    train_items, val_items = split_patients(items, seed=args.seed)

    train_ds = BraTSPreprocessedDataset(train_items)
    val_ds = BraTSPreprocessedDataset(val_items)

    train_loader = DataLoader(
        train_ds,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
        collate_fn=collate_fn,
        pin_memory=(device.type == "cuda"),
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=1,
        shuffle=False,
        num_workers=args.num_workers,
        collate_fn=collate_fn,
        pin_memory=(device.type == "cuda"),
    )

    # Model -----------------------------------------------------------
    model = get_model(in_channels=4, out_channels=1, device=device)
    logger.info(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")

    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-5)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=args.epochs, eta_min=1e-7
    )
    loss_fn = DiceLoss(sigmoid=True, smooth_nr=1e-5, smooth_dr=1e-5)

    # Training loop ---------------------------------------------------
    best_val_dice = 0.0
    patience_counter = 0

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()

        # ---------- Train ----------
        model.train()
        train_loss_sum = 0.0
        train_count = 0

        for batch_idx, (x, y, pids) in enumerate(train_loader, 1):
            x = x.to(device)        # (B, 4, D, H, W)
            y = y.to(device)        # (B, 1, D, H, W)

            optimizer.zero_grad()
            logits = model(x)       # (B, 1, D, H, W)
            loss = loss_fn(logits, y)
            loss.backward()
            optimizer.step()

            train_loss_sum += loss.item() * x.size(0)
            train_count += x.size(0)

            if batch_idx % 10 == 0 or batch_idx == len(train_loader):
                logger.info(
                    f"  Epoch {epoch}/{args.epochs}  "
                    f"batch {batch_idx}/{len(train_loader)}  "
                    f"loss={loss.item():.4f}"
                )

        avg_train_loss = train_loss_sum / max(train_count, 1)

        # ---------- Validate (sliding window) ----------
        model.eval()
        val_dice_sum = 0.0
        val_iou_sum = 0.0
        val_count = 0

        with torch.no_grad():
            for x, y, pids in val_loader:
                x = x.to(device)
                y = y.to(device)

                logits = sliding_window_inference(
                    x, roi_size=roi_size, sw_batch_size=2,
                    predictor=model, overlap=0.25,
                )
                pred = torch.sigmoid(logits)
                metrics = compute_all_metrics(pred.cpu(), y.cpu())
                val_dice_sum += metrics["dice"]
                val_iou_sum += metrics["iou"]
                val_count += 1

        avg_val_dice = val_dice_sum / max(val_count, 1)
        avg_val_iou = val_iou_sum / max(val_count, 1)
        elapsed = time.time() - t0

        scheduler.step()

        logger.info(
            f"Epoch {epoch}/{args.epochs} | "
            f"train_loss={avg_train_loss:.4f} | "
            f"val_dice={avg_val_dice:.4f} | "
            f"val_iou={avg_val_iou:.4f} | "
            f"lr={scheduler.get_last_lr()[0]:.2e} | "
            f"time={elapsed:.0f}s"
        )

        # Checkpoint best
        if avg_val_dice > best_val_dice:
            best_val_dice = avg_val_dice
            patience_counter = 0
            ckpt_path = out_dir / "best.pt"
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "best_val_dice": best_val_dice,
                    "roi_size": roi_size,
                },
                ckpt_path,
            )
            logger.info(f"  >> New best model saved (dice={best_val_dice:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= args.patience:
                logger.info(
                    f"Early stopping at epoch {epoch} "
                    f"(no improvement for {args.patience} epochs)"
                )
                break

        # Also save last checkpoint
        torch.save(
            {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "best_val_dice": best_val_dice,
                "roi_size": roi_size,
            },
            out_dir / "last.pt",
        )

    logger.info(f"Training complete. Best val Dice = {best_val_dice:.4f}")
    logger.info(f"Checkpoints saved in {out_dir}")


if __name__ == "__main__":
    main()
