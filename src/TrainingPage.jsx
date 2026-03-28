import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useChat } from './context/ChatContext'
import {
    Brain,
    Scan,
    Activity,
    ChevronLeft,
    ZoomIn,
    ZoomOut,
    Sun,
    Contrast,
    Move,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Upload,
    Layers,
    FlaskConical,
    Trash2,
    Loader2
} from 'lucide-react'
import Button from '@/components/ui/Button'
import GlobalNavigation from '@/components/GlobalNavigation'
import client from '@/api/client'


/**
 * Page S'entraîner - Simulation d'examen
 * Comprend 3 états : SELECTION -> EXAMEN -> RESULTAT
 */
const TrainingPage = () => {
    const { setChatVisibility } = useChat()
    // État principal : 'selection' | 'exam' | 'result'
    const [step, setStep] = useState('selection')

    // Visibilité du Chatbot : caché pendant l'examen, visible sinon
    useEffect(() => {
        if (step === 'exam') {
            setChatVisibility(false)
        } else {
            setChatVisibility(true)
        }
        // Cleanup : toujours réafficher en quittant la page
        return () => setChatVisibility(true)
    }, [step, setChatVisibility])

    // État de l'examen en cours
    const [selectedExam, setSelectedExam] = useState(null)
    const [userMarker, setUserMarker] = useState(null) // {x, y} en %

    // --- Demo Annotation / Classification state ---
    const [demoFiles, setDemoFiles] = useState({ t1ce: null, t1: null, t2: null, flair: null })
    const [demoSession, setDemoSession] = useState(null) // { sessionId, slices, shape }
    const [sliceIndex, setSliceIndex] = useState(64)
    const [modality, setModality] = useState('t1ce')
    const [points, setPoints] = useState([])
    const [isClosed, setIsClosed] = useState(false)
    const [dragIndex, setDragIndex] = useState(null)
    const [prediction, setPrediction] = useState(null)
    const [demoLoading, setDemoLoading] = useState(false)
    const [predictLoading, setPredictLoading] = useState(false)
    const [demoError, setDemoError] = useState(null)
    const canvasRef = useRef(null)
    const sliceImgRef = useRef(null)

    // Annotation canvas draw
    const drawAnnotation = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (points.length === 0) return

        ctx.beginPath()
        ctx.moveTo(points[0].x, points[0].y)
        points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
        if (isClosed) ctx.closePath()

        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.stroke()

        if (isClosed) {
            ctx.fillStyle = 'rgba(59,130,246,0.25)'
            ctx.fill()
        }

        // Draw control points
        points.forEach((p, i) => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, i === 0 ? 6 : 4, 0, Math.PI * 2)
            ctx.fillStyle = i === 0 ? '#facc15' : '#3b82f6'
            ctx.fill()
        })
    }, [points, isClosed])

    useEffect(() => { drawAnnotation() }, [drawAnnotation])

    const getCanvasPoint = (e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        }
    }

    const handleCanvasMouseDown = (e) => {
        if (isClosed) return
        const pt = getCanvasPoint(e)

        // Check if clicking near an existing point (drag mode)
        const hitIdx = points.findIndex(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 10)
        if (hitIdx !== -1) {
            setDragIndex(hitIdx)
            return
        }

        // Check if clicking near first point to close polygon
        if (points.length >= 3) {
            const first = points[0]
            if (Math.hypot(first.x - pt.x, first.y - pt.y) < 10) {
                setIsClosed(true)
                return
            }
        }

        setPoints(prev => [...prev, pt])
    }

    const handleCanvasMouseMove = (e) => {
        if (dragIndex === null) return
        const pt = getCanvasPoint(e)
        setPoints(prev => prev.map((p, i) => i === dragIndex ? pt : p))
    }

    const handleCanvasMouseUp = () => setDragIndex(null)

    const handleDemoFileChange = (modKey, file) => {
        setDemoFiles(prev => ({ ...prev, [modKey]: file }))
        setDemoSession(null)
        setPrediction(null)
        setDemoError(null)
    }

    const handlePreprocess = async () => {
        const missing = Object.entries(demoFiles).filter(([, f]) => !f).map(([k]) => k)
        if (missing.length > 0) {
            setDemoError(`Fichiers manquants : ${missing.join(', ')}`)
            return
        }
        setDemoLoading(true)
        setDemoError(null)
        setPrediction(null)
        setPoints([])
        setIsClosed(false)
        try {
            const form = new FormData()
            Object.entries(demoFiles).forEach(([key, file]) => form.append(key, file))
            const res = await client.post('/imaging/upload-and-preprocess', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            setDemoSession({ sessionId: res.data.session_id, slices: res.data.slices, shape: res.data.shape })
            setSliceIndex(Math.floor(res.data.slices / 2))
        } catch (err) {
            setDemoError(err?.response?.data?.detail ?? 'Erreur lors du prétraitement')
        } finally {
            setDemoLoading(false)
        }
    }

    const handlePredict = async () => {
        if (!demoSession) return
        setPredictLoading(true)
        setDemoError(null)
        try {
            const res = await client.post(`/imaging/predict/${demoSession.sessionId}`)
            setPrediction(res.data)
        } catch (err) {
            setDemoError(err?.response?.data?.detail ?? 'Erreur lors de la prédiction')
        } finally {
            setPredictLoading(false)
        }
    }

    const sliceUrl = demoSession
        ? `/api/imaging/slice/${demoSession.sessionId}/${modality}/${sliceIndex}`
        : null

    // Données mockées des examens disponibles
    const exams = [
        {
            id: 'radio-thorax',
            type: 'Radiographie',
            title: 'Thorax Face',
            level: 'Débutant',
            description: 'Suspicion de pneumopathie basale droite.',
            // Image placeholder style radio
            image: "https://placehold.co/800x800/1e293b/FFFFFF/png?text=Radio+Thorax+-+Cas+N°1",
            target: { x: 65, y: 70, radius: 10 }, // Zone correcte fictive
            feedback: "La pneumopathie est visible dans le lobe inférieur droit, caractérisée par une opacité alvéolaire."
        },
        {
            id: 'irm-cerveau',
            type: 'IRM',
            title: 'Cérébral Axial T2',
            level: 'Intermédiaire',
            description: 'Céphalées chroniques. Recherche de processus expansif.',
            image: "https://placehold.co/800x800/0f172a/FFFFFF/png?text=IRM+Cerebrale+-+Cas+N°2",
            target: { x: 45, y: 40, radius: 8 },
            feedback: "Une lésion hyperintense est visible en région pariétale gauche."
        },
        {
            id: 'scan-abdo',
            type: 'Scanner',
            title: 'Abdomen-Pelvis',
            level: 'Avancé',
            description: 'Douleur fosse iliaque droite. Suspicion appendicite.',
            image: "https://placehold.co/800x800/334155/FFFFFF/png?text=Scanner+Abdo+-+Cas+N°3",
            target: { x: 30, y: 60, radius: 5 },
            feedback: "L'appendice est dilaté avec une infiltration de la graisse péri-appendiculaire."
        }
    ]

    // Gestion du clic sur l'image (Simulation annotation)
    const handleImageClick = (e) => {
        if (step !== 'exam') return

        // Récupération coordonnées relatives %
        const rect = e.target.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setUserMarker({ x, y })
    }

    // Validation du résultat
    const handleValidate = () => {
        setStep('result')
    }

    // Calcul du score fictif basé sur la distance
    const getScore = () => {
        if (!userMarker || !selectedExam) return 0
        const dist = Math.sqrt(
            Math.pow(userMarker.x - selectedExam.target.x, 2) +
            Math.pow(userMarker.y - selectedExam.target.y, 2)
        )
        // Score simple : plus c'est proche, plus c'est haut
        return Math.max(0, Math.round(100 - dist * 2))
    }

    // --- RENDU : ÉTAPE 1 - SÉLECTION ---
    if (step === 'selection') {
        return (
            <div className="min-h-screen bg-slate-50 p-6 md:p-12">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-12">
                        <GlobalNavigation />
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">S'entraîner</h1>
                            <p className="text-slate-500">Choisissez un cas clinique pour commencer la simulation.</p>
                        </div>
                    </div>

                    {/* Grille de choix */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 cursor-pointer overflow-hidden group relative"
                                onClick={() => {
                                    setSelectedExam(exam)
                                    setStep('exam')
                                    setUserMarker(null)
                                }}
                            >
                                {/* Badge Type */}
                                <div className="absolute top-4 right-4">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${exam.type === 'IRM' ? 'bg-purple-100 text-purple-600' :
                                        exam.type === 'Scanner' ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                        {exam.type}
                                    </span>
                                </div>

                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-medical-50 transition-colors">
                                    {exam.type === 'IRM' ? <Brain className="w-6 h-6 text-slate-600 group-hover:text-medical-600" /> :
                                        exam.type === 'Scanner' ? <Scan className="w-6 h-6 text-slate-600 group-hover:text-medical-600" /> :
                                            <Activity className="w-6 h-6 text-slate-600 group-hover:text-medical-600" />}
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1">{exam.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{exam.description}</p>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                    <span className="text-xs font-medium text-slate-400">{exam.level}</span>
                                    <span className="text-sm font-semibold text-medical-600 flex items-center gap-1">
                                        Commencer <ChevronLeft className="w-4 h-4 rotate-180" />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Demo Annotation / Classification ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-12 bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden"
                    >
                        {/* Section header */}
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FlaskConical className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Démo Annotation / Classification</h2>
                                <p className="text-sm text-slate-500">Chargez vos propres modalités NIfTI (T1CE, T1, T2, FLAIR) pour annoter et classifier.</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Step 1 — Upload */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Étape 1 — Charger les modalités
                                </h3>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {['t1ce', 't1', 't2', 'flair'].map((mod) => (
                                        <label
                                            key={mod}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                                                ${demoFiles[mod] ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-slate-50'}`}
                                        >
                                            <span className="text-xs font-bold uppercase text-slate-500">{mod}</span>
                                            {demoFiles[mod]
                                                ? <span className="text-xs text-blue-600 text-center truncate w-full text-center">{demoFiles[mod].name}</span>
                                                : <span className="text-xs text-slate-400">.nii / .nii.gz</span>
                                            }
                                            <input
                                                type="file"
                                                accept=".nii,.nii.gz,.gz"
                                                className="hidden"
                                                onChange={e => handleDemoFileChange(mod, e.target.files[0] ?? null)}
                                            />
                                        </label>
                                    ))}
                                </div>

                                <div className="mt-4 flex items-center gap-4">
                                    <button
                                        onClick={handlePreprocess}
                                        disabled={demoLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                                    >
                                        {demoLoading
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Prétraitement…</>
                                            : <><Layers className="w-4 h-4" /> Prétraiter</>
                                        }
                                    </button>
                                    {demoSession && (
                                        <span className="text-xs text-green-600 font-medium">
                                            ✓ Volume {demoSession.shape.join('×')} — {demoSession.slices} coupes axiales
                                        </span>
                                    )}
                                </div>

                                {demoError && (
                                    <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                                        {demoError}
                                    </p>
                                )}
                            </div>

                            {/* Step 2 — Slice viewer + Annotation */}
                            {demoSession && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <Scan className="w-4 h-4" /> Étape 2 — Visionner et Annoter
                                    </h3>

                                    {/* Modality selector */}
                                    <div className="flex gap-2 mb-4">
                                        {['t1ce', 't1', 't2', 'flair'].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setModality(m)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors
                                                    ${modality === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Slice slider */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-xs text-slate-500 w-20">Coupe axiale</span>
                                        <input
                                            type="range"
                                            min={0}
                                            max={demoSession.slices - 1}
                                            value={sliceIndex}
                                            onChange={e => { setSliceIndex(Number(e.target.value)); setPoints([]); setIsClosed(false) }}
                                            className="flex-1"
                                        />
                                        <span className="text-xs font-mono text-slate-600 w-10 text-right">{sliceIndex}</span>
                                    </div>

                                    {/* Image + canvas overlay */}
                                    <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden bg-black">
                                        <img
                                            ref={sliceImgRef}
                                            src={sliceUrl}
                                            alt={`Coupe ${sliceIndex} — ${modality}`}
                                            className="block max-w-xs w-64 h-64 object-contain"
                                            onLoad={e => {
                                                const canvas = canvasRef.current
                                                if (canvas) {
                                                    canvas.width = e.target.naturalWidth || 256
                                                    canvas.height = e.target.naturalHeight || 256
                                                }
                                            }}
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute inset-0 w-full h-full cursor-crosshair"
                                            onMouseDown={handleCanvasMouseDown}
                                            onMouseMove={handleCanvasMouseMove}
                                            onMouseUp={handleCanvasMouseUp}
                                            onMouseLeave={handleCanvasMouseUp}
                                        />
                                    </div>

                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            onClick={() => { setPoints([]); setIsClosed(false) }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Effacer annotation
                                        </button>
                                        <span className="text-xs text-slate-400">
                                            {isClosed ? 'Polygone fermé' : points.length === 0 ? 'Cliquez pour placer des points' : `${points.length} point(s) — cliquez près du premier point pour fermer`}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Step 3 — Classification */}
                            {demoSession && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <Brain className="w-4 h-4" /> Étape 3 — Classification tumorale
                                    </h3>

                                    <button
                                        onClick={handlePredict}
                                        disabled={predictLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                                    >
                                        {predictLoading
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse…</>
                                            : <><Brain className="w-4 h-4" /> Prédire la présence d'une tumeur</>
                                        }
                                    </button>

                                    {prediction && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-4 flex items-center gap-3 px-5 py-4 rounded-xl border ${prediction.tumor_detected
                                                ? 'bg-red-50 border-red-200 text-red-700'
                                                : 'bg-green-50 border-green-200 text-green-700'
                                                }`}
                                        >
                                            {prediction.tumor_detected
                                                ? <AlertCircle className="w-5 h-5 shrink-0" />
                                                : <CheckCircle2 className="w-5 h-5 shrink-0" />
                                            }
                                            <div>
                                                <p className="font-bold text-sm">
                                                    {prediction.tumor_detected ? 'Tumeur détectée' : 'Aucune tumeur détectée'}
                                                </p>
                                                <p className="text-xs opacity-75">
                                                    Confiance : {(prediction.confidence * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    // --- RENDU : ÉTAPE 2 & 3 - VIEWER (Exam & Result) ---
    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
            {/* Toolbar Haut */}
            <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setStep('selection')}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Quitter"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-bold text-sm md:text-base">{selectedExam.title}</h2>
                        <p className="text-xs text-slate-400">{selectedExam.type} • {selectedExam.level}</p>
                    </div>
                </div>

                {/* Consigne centrale */}
                <div className="hidden md:block bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700 text-sm">
                    💡 Consigne : <span className="text-blue-300">{selectedExam.description}</span>
                </div>

                {/* Bouton Validation */}
                <div>
                    {step === 'exam' ? (
                        <Button
                            size="sm"
                            onClick={handleValidate}
                            disabled={!userMarker}
                            className={!userMarker ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            {userMarker ? 'Valider l\'analyse' : 'Placez un point'}
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setStep('selection')}
                            icon={RotateCcw}
                        >
                            Nouveau cas
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Outils Latéraux (Mock) */}
                <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 gap-4 shrink-0">
                    {[ZoomIn, ZoomOut, Move, Sun, Contrast].map((Icon, i) => (
                        <button key={i} className="p-3 bg-slate-700/50 rounded-xl hover:bg-medical-600 hover:text-white text-slate-400 transition-all">
                            <Icon className="w-5 h-5" />
                        </button>
                    ))}
                </div>

                {/* Zone Image Centrale */}
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                    <div className="relative max-w-full max-h-full aspect-square md:aspect-auto">
                        <img
                            src={selectedExam.image}
                            alt="Examen médical"
                            className="max-h-[calc(100vh-4rem)] object-contain select-none cursor-crosshair"
                            onClick={handleImageClick}
                        />

                        {/* Marqueur Utilisateur (Cercle) */}
                        {userMarker && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`absolute w-6 h-6 -ml-3 -mt-3 border-2 rounded-full shadow-lg ${step === 'result'
                                    ? (getScore() > 70 ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20')
                                    : 'border-medical-400 bg-medical-400/30'
                                    }`}
                                style={{ top: `${userMarker.y}%`, left: `${userMarker.x}%` }}
                            >
                                <div className={`w-1 h-1 mx-auto mt-2 rounded-full ${step === 'result' ? (getScore() > 70 ? 'bg-green-500' : 'bg-red-500') : 'bg-medical-400'
                                    }`} />
                            </motion.div>
                        )}

                        {/* Marqueur IA (Cible correcte) - Visible seulement en résultat */}
                        {step === 'result' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 1.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="absolute border-2 border-dashed border-yellow-400 rounded-full bg-yellow-400/10"
                                style={{
                                    top: `${selectedExam.target.y}%`,
                                    left: `${selectedExam.target.x}%`,
                                    width: `${selectedExam.target.radius * 2}%`,
                                    height: `${selectedExam.target.radius * 2}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-400 bg-black/75 px-2 py-0.5 rounded">
                                    Zone IA
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Overlay Résultat */}
                    <AnimatePresence>
                        {step === 'result' && (
                            <motion.div
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                className="absolute top-4 right-4 w-80 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-2xl"
                            >
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-medical-400" />
                                    Analyse IA
                                </h3>

                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-slate-400">Précision</span>
                                    <span className={`text-3xl font-bold ${getScore() > 70 ? 'text-green-400' : 'text-orange-400'
                                        }`}>
                                        {getScore()}%
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            {selectedExam.feedback}
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3 mt-4">
                                        {getScore() > 70 ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                                        )}
                                        <p className="text-xs text-slate-400">
                                            {getScore() > 70
                                                ? "Excellent ! Votre zone correspond parfaitement à l'anomalie détectée."
                                                : "Attention, vous êtes légèrement à côté de la zone d'intérêt principale."}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

export default TrainingPage
