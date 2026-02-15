import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
    KeyRound,
    Loader2,
    ArrowRight
} from 'lucide-react'
import Button from '@/components/ui/Button'
import GlobalNavigation from '@/components/GlobalNavigation'
import { joinSeriesByCode, getSeriesDetail, submitSeriesResult, getRandomTrainingSeries } from './api/classes'


/**
 * Page S'entraîner - Simulation d'examen
 * Comprend 3 états : SELECTION -> EXAMEN -> RESULTAT
 */
const TrainingPage = () => {
    const { setChatVisibility } = useChat()
    const navigate = useNavigate()
    const { seriesId } = useParams()

    // État principal : 'selection' | 'exam' | 'result'
    const [step, setStep] = useState('selection')

    // Mode Série (Multi-images)
    const [currentSeries, setCurrentSeries] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [seriesImages, setSeriesImages] = useState([])

    // Résultats accumulés
    const [results, setResults] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Visibilité du Chatbot : caché pendant l'examen, visible sinon
    useEffect(() => {
        if (step === 'exam') {
            setChatVisibility(false)
        } else {
            setChatVisibility(true)
        }
        return () => setChatVisibility(true)
    }, [step, setChatVisibility])

    // État de l'examen en cours
    const [selectedExam, setSelectedExam] = useState(null)
    const [userMarker, setUserMarker] = useState(null)

    // Chargement de la série si URL param existe
    useEffect(() => {
        if (seriesId) {
            loadSeries(seriesId)
        }
    }, [seriesId])

    const initializeSeries = (data) => {
        setCurrentSeries(data)

        const imagesList = data.images || []
        const imagesAsExams = imagesList.map((img, idx) => ({
            id: img.id,
            type: 'Cas Clinique',
            title: `${data.title} - ${idx + 1}/${imagesList.length}`,
            level: data.difficulty,
            description: data.description || "Analyse de l'image",
            image: img.imageUrl,
            target: {
                x: 30 + Math.random() * 40,
                y: 30 + Math.random() * 40,
                radius: 8 + Math.random() * 5
            },
            feedback: "Zone d'intérêt identifiée par l'IA (Simulation)."
        }))

        setSeriesImages(imagesAsExams)
        setResults([])
        if (imagesAsExams.length > 0) {
            setSelectedExam(imagesAsExams[0])
            setCurrentImageIndex(0)
            setStep('exam')
        }
    }

    const loadSeries = async (id) => {
        try {
            const { data } = await getSeriesDetail(id)

            // Access Control: Block if already completed
            if (data.status === 'COMPLETED') {
                alert("Vous avez déjà terminé cette série !")
                navigate('/my-classes')
                return
            }

            initializeSeries(data)
        } catch (err) {
            console.error("Erreur chargement série", err)
        }
    }

    const handleDifficultySelect = async (difficulty) => {
        try {
            const { data } = await getRandomTrainingSeries(difficulty)
            initializeSeries(data)
        } catch (err) {
            if (err.response && err.response.status === 404) {
                alert("Aucune série disponible pour ce niveau de difficulté.")
            } else {
                console.error("Erreur random series", err)
                alert("Erreur lors du chargement d'une série.")
            }
        }
    }

    const difficulties = [
        { id: 'EASY', label: 'Facile', description: 'Cas simples pour débuter.', color: 'bg-green-50 text-green-700 border-green-200', startColor: 'bg-green-100' },
        { id: 'MEDIUM', label: 'Moyen', description: 'Cas cliniques standards.', color: 'bg-blue-50 text-blue-700 border-blue-200', startColor: 'bg-blue-100' },
        { id: 'HARD', label: 'Difficile', description: 'Pathologies complexes.', color: 'bg-red-50 text-red-700 border-red-200', startColor: 'bg-red-100' },
    ]

    // Gestion du clic sur l'image (Simulation annotation)
    const handleImageClick = (e) => {
        if (step !== 'exam') return

        const rect = e.target.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setUserMarker({ x, y })
    }

    // Validation du résultat
    const handleValidate = () => {
        setStep('result')
    }

    const [startTime, setStartTime] = useState(null)

    useEffect(() => {
        if (step === 'exam' && !startTime) {
            setStartTime(Date.now())
        } else if (step === 'selection') {
            setStartTime(null)
        }
    }, [step])

    const handleNextImage = async () => {
        if (!currentSeries) return

        const currentScore = getScore()
        const newResults = [...results, currentScore]
        setResults(newResults)

        if (currentImageIndex < seriesImages.length - 1) {
            const nextIndex = currentImageIndex + 1
            setCurrentImageIndex(nextIndex)
            setSelectedExam(seriesImages[nextIndex])
            setUserMarker(null)
            setStep('exam')
        } else {
            await finishSeries(newResults)
        }
    }

    const finishSeries = async (finalResults) => {
        setIsSubmitting(true)
        try {
            const totalScore = finalResults.reduce((a, b) => a + b, 0)
            const averagePrecision = finalResults.length > 0 ? totalScore / finalResults.length : 0
            const globalScore = Math.round(averagePrecision * 10)

            // Metrics
            const durationSec = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
            const correctCount = finalResults.filter(r => r >= 50).length

            await submitSeriesResult(currentSeries.id, {
                precision: parseFloat(averagePrecision.toFixed(1)),
                score: globalScore,
                duration: durationSec,
                totalImages: finalResults.length,
                correctAnswers: correctCount
            })

            navigate('/dashboard')
        } catch (err) {
            console.error("Erreur soumission", err)
            alert("Erreur lors de l'enregistrement des résultats")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Calcul du score fictif basé sur la distance
    const getScore = () => {
        if (!userMarker || !selectedExam) return 0
        const dist = Math.sqrt(
            Math.pow(userMarker.x - selectedExam.target.x, 2) +
            Math.pow(userMarker.y - selectedExam.target.y, 2)
        )
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
                    <div className="grid md:grid-cols-3 gap-6">
                        {difficulties.map((diff) => (
                            <motion.div
                                key={diff.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -5 }}
                                className={`rounded-2xl p-8 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${diff.color} bg-white`}
                                onClick={() => handleDifficultySelect(diff.id)}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${diff.startColor}`}>
                                    {diff.id === 'EASY' ? <CheckCircle2 className="w-8 h-8" /> :
                                        diff.id === 'MEDIUM' ? <Activity className="w-8 h-8" /> :
                                            <AlertCircle className="w-8 h-8" />}
                                </div>

                                <h3 className="text-2xl font-bold mb-2">{diff.label}</h3>
                                <p className="opacity-80 mb-8">{diff.description}</p>

                                <div className="flex items-center justify-end">
                                    <span className="text-sm font-bold flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                                        Commencer <ChevronLeft className="w-4 h-4 rotate-180" />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // --- RENDU : ÉTAPE 2 & 3 - VIEWER (Exam & Result) ---

    // Safeguard: loading state
    if (step !== 'selection' && !selectedExam) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-medical-600" />
                    <p className="text-slate-500">Chargement de la série...</p>
                    <Button variant="secondary" onClick={() => navigate('/my-classes')}>
                        Retour
                    </Button>
                </div>
            </div>
        )
    }

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
                            {userMarker ? "Valider l'analyse" : 'Placez un point'}
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            {!currentSeries && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setStep('selection')}
                                    icon={RotateCcw}
                                >
                                    Nouveau cas
                                </Button>
                            )}
                            {currentSeries && (
                                <Button
                                    size="sm"
                                    onClick={handleNextImage}
                                    icon={ArrowRight}
                                >
                                    {currentImageIndex < seriesImages.length - 1 ? 'Image suivante' : 'Terminer la série'}
                                </Button>
                            )}
                        </div>
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
