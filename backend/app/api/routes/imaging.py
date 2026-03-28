"""Imaging API — NIfTI upload, preprocessing, slice extraction, and tumor prediction."""
from __future__ import annotations

import io
import sys
import uuid
from pathlib import Path

import nibabel as nib
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

# Add services/ to sys.path so pipeline and predict can be imported
_APP_DIR = Path(__file__).resolve().parents[3]          # backend/
_SERVICES_DIR = _APP_DIR / "services"
if str(_SERVICES_DIR) not in sys.path:
    sys.path.insert(0, str(_SERVICES_DIR))

from pipeline.pipeline import pipeline_0  # noqa: E402

router = APIRouter(prefix="/imaging", tags=["imaging"])

_SESSIONS_DIR = Path("/tmp/eroz_sessions")
_SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

_MODALITIES = ("t1ce", "t1", "t2", "flair")


def _session_dir(session_id: str) -> Path:
    return _SESSIONS_DIR / session_id


# ---------------------------------------------------------------------------
# POST /imaging/upload-and-preprocess
# ---------------------------------------------------------------------------

@router.post("/upload-and-preprocess")
async def upload_and_preprocess(
    t1ce: UploadFile,
    t1: UploadFile,
    t2: UploadFile,
    flair: UploadFile,
):
    """
    Accept 4 NIfTI modality files, run pipeline_0, and persist preprocessed arrays.
    Returns session_id, volume shape, and number of axial slices.
    """
    session_id = str(uuid.uuid4())
    sess_dir = _session_dir(session_id)
    sess_dir.mkdir(parents=True)

    # Save raw uploads with modality-recognisable filenames (pipeline uses filename matching)
    uploads: dict[str, UploadFile] = {
        "t1ce.nii": t1ce,
        "t1.nii": t1,
        "t2.nii": t2,
        "flair.nii": flair,
    }

    modalities: dict[str, nib.Nifti1Image] = {}
    for fname, upload in uploads.items():
        raw_bytes = await upload.read()
        dest = sess_dir / fname
        dest.write_bytes(raw_bytes)
        try:
            nii = nib.load(str(dest))
            nii.get_fdata()  # force data load to catch broken files early
            modalities[fname] = nii
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Could not read {fname}: {exc}") from exc

    # Run pipeline_0 (canonicalise + normalise all modalities)
    result = pipeline_0(modalities)
    if not result["success"]:
        raise HTTPException(status_code=422, detail=result.get("error", "Preprocessing failed"))

    preprocessed: dict[str, nib.Nifti1Image] = result["preprocessed"]

    # Persist preprocessed arrays as .npy files
    shape = None
    for fname, nii in preprocessed.items():
        arr = nii.get_fdata(dtype=np.float32)
        modality_key = fname.replace(".nii", "")  # e.g. "flair"
        np.save(str(sess_dir / f"{modality_key}_preprocessed.npy"), arr)
        if shape is None:
            shape = arr.shape

    if shape is None:
        raise HTTPException(status_code=500, detail="No preprocessed data produced")

    return {
        "session_id": session_id,
        "shape": list(shape[:3]),
        "slices": int(shape[2]),
    }


# ---------------------------------------------------------------------------
# GET /imaging/slice/{session_id}/{modality}/{slice_index}
# ---------------------------------------------------------------------------

@router.get("/slice/{session_id}/{modality}/{slice_index}")
def get_slice(session_id: str, modality: str, slice_index: int):
    """
    Return an axial slice from a preprocessed volume as a PNG image.
    modality: one of t1ce, t1, t2, flair
    """
    if modality not in _MODALITIES:
        raise HTTPException(status_code=400, detail=f"modality must be one of {_MODALITIES}")

    npy_path = _session_dir(session_id) / f"{modality}_preprocessed.npy"
    if not npy_path.exists():
        raise HTTPException(status_code=404, detail="Session or modality not found")

    arr = np.load(str(npy_path))  # shape (X, Y, Z)

    if slice_index < 0 or slice_index >= arr.shape[2]:
        raise HTTPException(
            status_code=400,
            detail=f"slice_index {slice_index} out of range [0, {arr.shape[2] - 1}]",
        )

    # Extract axial slice and normalise to uint8
    slc = arr[:, :, slice_index]
    mn, mx = slc.min(), slc.max()
    if mx > mn:
        slc = ((slc - mn) / (mx - mn) * 255).astype(np.uint8)
    else:
        slc = np.zeros_like(slc, dtype=np.uint8)

    # Rotate 90° so axial images appear anatomically correct (head up)
    slc = np.rot90(slc)

    png_bytes = _array_to_png(slc)
    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png")


def _array_to_png(arr: np.ndarray) -> bytes:
    """Convert a 2D uint8 numpy array to PNG bytes without PIL."""
    try:
        from PIL import Image
        img = Image.fromarray(arr, mode="L")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except ImportError:
        pass

    # Fallback: use matplotlib
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(arr.shape[1] / 100, arr.shape[0] / 100), dpi=100)
    ax.imshow(arr, cmap="gray", aspect="equal")
    ax.axis("off")
    plt.tight_layout(pad=0)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# POST /imaging/predict/{session_id}
# ---------------------------------------------------------------------------

@router.post("/predict/{session_id}")
def predict(session_id: str):
    """
    Run the tumor classification model on the uploaded FLAIR + T1CE files.
    Returns tumor_detected (bool) and confidence (float).
    """
    sess_dir = _session_dir(session_id)

    paths = {m: sess_dir / f"{m}.nii" for m in _MODALITIES}
    for m, p in paths.items():
        if not p.exists():
            raise HTTPException(status_code=404, detail=f"Session file not found: {m}.nii")

    _model_dir = _SERVICES_DIR / "model-predict"
    if str(_model_dir) not in sys.path:
        sys.path.insert(0, str(_model_dir))
    from predict import predict_tumor  # noqa: E402

    result = predict_tumor(
        t1_nii=nib.load(str(paths["t1"])),
        t1ce_nii=nib.load(str(paths["t1ce"])),
        t2_nii=nib.load(str(paths["t2"])),
        flair_nii=nib.load(str(paths["flair"])),
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Prediction failed"))

    return {
        "tumor_detected": result["tumor_detected"],
        "confidence": result["confidence"],
    }
