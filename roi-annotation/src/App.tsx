import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// --- Types & Constantes ---
type Point = { x: number; y: number };
type Metrics = {
  precision: number;
  recall: number;
  dice: number;
  iou: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const MAX_IMG_DIMENSION = 512;
const SNAP_DISTANCE_SQ = 100; // 10px^2
const DRAG_DISTANCE_SQ = 64;  // 8px^2

export default function App() {
  // refs
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // files / image
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageUrlObject, setImageUrlObject] = useState<string | null>(null); // for revoke
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [refMaskFile, setRefMaskFile] = useState<File | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // drawing state
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // API / UI state
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // --- 1) load image and size canvases ---
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      const { naturalWidth: nw, naturalHeight: nh } = img;
      const ratio = Math.max(nw, nh) > MAX_IMG_DIMENSION ? MAX_IMG_DIMENSION / Math.max(nw, nh) : 1;
      const displayW = Math.round(nw * ratio);
      const displayH = Math.round(nh * ratio);

      const fc = frontCanvasRef.current;
      const bc = backCanvasRef.current;
      if (fc && bc) {
        // set internal pixel size (no DPR handling to keep simple and consistent)
        fc.width = displayW;
        fc.height = displayH;
        fc.style.width = `${displayW}px`;
        fc.style.height = `${displayH}px`;

        bc.width = displayW;
        bc.height = displayH;
        bc.style.width = `${displayW}px`;
        bc.style.height = `${displayH}px`;
      }

      setNaturalSize({ w: nw, h: nh });
      // clear overlay when loading a new image
      if (bc) bc.getContext("2d")?.clearRect(0, 0, displayW, displayH);
      setPoints([]);
      setIsClosed(false);
      setMetrics(null);
      setOverlaySrc(null);
    };
    // no cleanup on img here (we revoke object url elsewhere)
  }, [imageSrc]);

  // revoke objectURL on unmount / change
  useEffect(() => {
    return () => {
      if (imageUrlObject) {
        URL.revokeObjectURL(imageUrlObject);
      }
    };
  }, [imageUrlObject]);

  // --- helpers: scale conversions ---
  const getScale = () => {
    const canvas = frontCanvasRef.current;
    if (!canvas || !naturalSize) return { sx: 1, sy: 1 };
    return { sx: naturalSize.w / canvas.width, sy: naturalSize.h / canvas.height };
  };

  const toImgCoords = (cx: number, cy: number): Point => {
    const { sx, sy } = getScale();
    return { x: Math.round(cx * sx), y: Math.round(cy * sy) };
  };

  const toCanvasCoords = (p: Point): Point => {
    const { sx, sy } = getScale();
    return { x: p.x / sx, y: p.y / sy };
  };

  // --- 3) drawing engine (reactive) ---
  useEffect(() => {
    const canvas = frontCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    else {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (points.length === 0) return;

    // polygon
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 1;
    ctx.beginPath();
    points.forEach((p, i) => {
      const pc = toCanvasCoords(p);
      if (i === 0) ctx.moveTo(pc.x, pc.y);
      else ctx.lineTo(pc.x, pc.y);
    });
    if (isClosed) ctx.closePath();
    ctx.stroke();

    // handles
    points.forEach((p, i) => {
      const pc = toCanvasCoords(p);
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.arc(pc.x, pc.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "10px Arial";
      ctx.fillText(String(i + 1), pc.x + 6, pc.y - 6);
    });
  }, [points, isClosed, naturalSize]);

  // --- 4) mouse events ---
  const getMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = frontCanvasRef.current;
    if (!canvas) return { cx: 0, cy: 0 };
    const rect = canvas.getBoundingClientRect();
    return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isClosed || dragIndex !== null) return;
    const { cx, cy } = getMouseCoords(e);
    const imgP = toImgCoords(cx, cy);

    if (points.length >= 3) {
      const firstCanvas = toCanvasCoords(points[0]);
      const d2 = (firstCanvas.x - cx) ** 2 + (firstCanvas.y - cy) ** 2;
      if (d2 < SNAP_DISTANCE_SQ) {
        setIsClosed(true);
        return;
      }
    }
    setPoints((prev) => [...prev, imgP]);
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { cx, cy } = getMouseCoords(e);
    const idx = points.findIndex((p) => {
      const pc = toCanvasCoords(p);
      return (pc.x - cx) ** 2 + (pc.y - cy) ** 2 < DRAG_DISTANCE_SQ;
    });
    if (idx !== -1) setDragIndex(idx);
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragIndex === null) return;
    const { cx, cy } = getMouseCoords(e);
    setPoints((prev) => {
      const next = prev.slice();
      next[dragIndex] = toImgCoords(cx, cy);
      return next;
    });
  };

  // --- 5) user actions ---
  const clearAll = () => {
    setPoints([]);
    setIsClosed(false);
    setMetrics(null);
    setOverlaySrc(null);
    setApiError(null);
    const bc = backCanvasRef.current;
    if (bc) bc.getContext("2d")?.clearRect(0, 0, bc.width, bc.height);
  };

  const exportJSON = () => {
    if (!naturalSize) return alert("Charge une image d'abord.");
    const payload = {
      annotation_id: uuidv4(),
      image_name: imageFile?.name ?? null,
      image_width: naturalSize.w,
      image_height: naturalSize.h,
      type: "polygon",
      points,
      created_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `annotation_${payload.annotation_id}.json`;
    a.click();
  };

  const buildMaskCanvas = () => {
    if (!isClosed || points.length < 3 || !naturalSize) {
      alert("Ferme le polygone avant de rasteriser.");
      return null;
    }
    const off = document.createElement("canvas");
    off.width = naturalSize.w;
    off.height = naturalSize.h;
    const ctx = off.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    return off;
  };

  const rasterizeToMask = async (download = false) => {
    const off = buildMaskCanvas();
    if (!off) return;
    const bc = backCanvasRef.current;
    if (!bc) return;
    const bctx = bc.getContext("2d")!;
    bctx.clearRect(0, 0, bc.width, bc.height);

    const tmpImg = new Image();
    tmpImg.src = off.toDataURL("image/png");
    await new Promise((res) => (tmpImg.onload = res));
    bctx.drawImage(tmpImg, 0, 0, bc.width, bc.height);

    const scaled = bctx.getImageData(0, 0, bc.width, bc.height);
    for (let i = 0; i < scaled.data.length; i += 4) {
      if (scaled.data[i] > 0) {
        scaled.data[i] = 255;
        scaled.data[i + 1] = 0;
        scaled.data[i + 2] = 0;
        scaled.data[i + 3] = 120;
      } else scaled.data[i + 3] = 0;
    }
    bctx.putImageData(scaled, 0, 0);

    if (download) {
      const blob = await new Promise<Blob | null>((res) => off.toBlob(res, "image/png"));
      if (blob) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `mask_${Date.now()}.png`;
        a.click();
      }
    }
  };

  // --- 6) API communication + overlay draw ---
  const callEvaluateApi = async (formData: FormData) => {
    setApiError(null);
    setIsEvaluating(true);
    setMetrics(null);
    setOverlaySrc(null);
    try {
      const response = await fetch(`${API_BASE_URL}/evaluate`, { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail ?? "Erreur API");
      setMetrics(payload.metrics as Metrics);
      setOverlaySrc(`data:image/png;base64,${payload.overlay_png_b64}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const drawOverlayOnBackCanvas = (overlayBase64: string | null) => {
    const bc = backCanvasRef.current;
    if (!bc) return;
    const bctx = bc.getContext("2d")!;
    bctx.clearRect(0, 0, bc.width, bc.height);
    if (!overlayBase64) return;
    const img = new Image();
    img.onload = () => bctx.drawImage(img, 0, 0, bc.width, bc.height);
    img.src = overlayBase64;
  };

  useEffect(() => {
    drawOverlayOnBackCanvas(overlaySrc);
  }, [overlaySrc]);

  const evaluateWithApi = async () => {
    if (!refMaskFile) return alert("Charge un masque de référence.");
    const off = buildMaskCanvas();
    if (!off) return;
    const predBlob = await new Promise<Blob | null>((res) => off.toBlob(res, "image/png"));
    if (!predBlob) return setApiError("Impossible de créer le masque prédit.");
    const formData = new FormData();
    formData.append("pred_file", predBlob, "pred_mask.png");
    formData.append("ref_file", refMaskFile);
    if (imageFile) formData.append("bg_file", imageFile);
    await callEvaluateApi(formData);
  };

  // --- 7) UI ---
  return (
  <div className="app">
    <h1 className="title">ROI Annotation & Mask Evaluation</h1>

    <div className="upload-row">
      <input type="file" accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setImageFile(f);
            setImageSrc(URL.createObjectURL(f));
          }
        }}
      />

      <input type="file" accept="image/*,.npy"
        onChange={(e) => setRefMaskFile(e.target.files?.[0] ?? null)}
      />
    </div>

    <div className="workspace">

      <div className="canvas-wrapper">
        <canvas
          ref={frontCanvasRef}
          onClick={onCanvasClick}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={() => setDragIndex(null)}
          onMouseLeave={() => setDragIndex(null)}
        />
        <canvas ref={backCanvasRef} className="overlay-canvas" />
      </div>

      <div className="panel">

        <div className="button-group">
          <button onClick={() => setPoints(p => p.slice(0, -1))}>Undo</button>
          <button onClick={clearAll}>Clear</button>
          <button onClick={() => setIsClosed(true)}>Finish</button>
          <button onClick={exportJSON}>Export</button>
        </div>

        <div className="button-group">
          <button onClick={() => rasterizeToMask(false)}>Preview</button>
          <button onClick={() => rasterizeToMask(true)}>Download</button>
          <button onClick={evaluateWithApi}>
            {isEvaluating ? "Evaluating..." : "Evaluate"}
          </button>
        </div>

        <div className="info">
          <p><strong>Points:</strong> {points.length}</p>
          <p><strong>Reference:</strong> {refMaskFile?.name ?? "None"}</p>
        </div>

        {apiError && (
  <div className="error">
    {apiError}
  </div>
)}

{metrics && (
  <div className="metrics">
    <h3>Results</h3>
    <ul>
      <li>Precision: {metrics.precision.toFixed(4)}</li>
      <li>Recall: {metrics.recall.toFixed(4)}</li>
      <li>Dice: {metrics.dice.toFixed(4)}</li>
      <li>IoU: {metrics.iou.toFixed(4)}</li>
      <li>TP / FP / FN / TN: {metrics.tp} / {metrics.fp} / {metrics.fn} / {metrics.tn}</li>
    </ul>
  </div>
)}

      </div>
    </div>
  </div>
);
}