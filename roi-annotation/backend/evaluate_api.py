from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import io
from metrics import compute_all_metrics, overlay_diff, to_binary

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def read_mask_from_file_like(file_bytes: bytes) -> np.ndarray:
    # essaie d'abord de décoder image (png,jpg)
    arr = np.frombuffer(file_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is not None and img.size > 0:
        # obtenir un masque 2D : si image couleur -> prendre canal 0 ou convertir en gris
        if img.ndim == 3:
            # si alpha channel present, utiliser alpha>0 comme masque sinon convertir en grayscale
            if img.shape[2] == 4:
                alpha = img[:, :, 3]
                return (alpha > 0).astype(np.uint8)
            else:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                return (gray > 0).astype(np.uint8)
        else:
            return (img > 0).astype(np.uint8)
    # si échec, peut être format numpy (.npy) — essayer de charger
    try:
        import numpy as _np, io as _io
        mask = _np.load(_io.BytesIO(file_bytes))
        return (mask > 0).astype(np.uint8)
    except Exception:
        raise ValueError("Impossible de lire le fichier comme image PNG/JPG ou NPY")

@app.post("/evaluate")
async def evaluate(pred_file: UploadFile = File(...), ref_file: UploadFile = File(...), bg_file: UploadFile | None = None):
    """
    Envoie deux fichiers (pred et reference). Retourne JSON metrics + image overlay PNG binaire.
    """
    pred_bytes = await pred_file.read()
    ref_bytes = await ref_file.read()

    try:
        pred_mask = read_mask_from_file_like(pred_bytes)
        ref_mask = read_mask_from_file_like(ref_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if pred_mask.shape != ref_mask.shape:
        # resize pred to ref (simple) -> warns user ideally
        pred_mask = cv2.resize(pred_mask.astype(np.uint8), (ref_mask.shape[1], ref_mask.shape[0]), interpolation=cv2.INTER_NEAREST)

    metrics = compute_all_metrics(pred_mask, ref_mask)

    # optional background image for overlay
    bg = None
    if bg_file:
        bg_bytes = await bg_file.read()
        arr = np.frombuffer(bg_bytes, dtype=np.uint8)
        bgi = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if bgi is not None:
            bg = bgi

    overlay = overlay_diff(pred_mask, ref_mask, background=bg, alpha=0.6)
    ok, png = cv2.imencode(".png", overlay)
    if not ok:
        raise HTTPException(status_code=500, detail="erreur encodage overlay")
    # prepare multipart-like response: JSON metrics + image bytes
    # ici on renvoie JSON + image encodée en base64 pour simplicité
    import base64
    overlay_b64 = base64.b64encode(png.tobytes()).decode("ascii")
    return JSONResponse({"metrics": metrics, "overlay_png_b64": overlay_b64})


@app.get("/")
def root():
    return {"message": "API is running"}
