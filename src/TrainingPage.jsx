import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    ChevronLeft,
    Brain,
    Scan,
    Activity,
    ZoomIn,
    ZoomOut,
    Sun,
    Contrast,
    Move,
    CheckCircle2,
    AlertCircle,
    RotateCcw
} from 'lucide-react'
import Button from '@/components/ui/Button'

/**
 * Page S'entraîner - Simulation d'examen
 * Comprend 3 états : SELECTION -> EXAMEN -> RESULTAT
 */
const TrainingPage = () => {
    // État principal : 'selection' | 'exam' | 'result'
    const [step, setStep] = useState('selection')

    // État de l'examen en cours
    const [selectedExam, setSelectedExam] = useState(null)
    const [userMarker, setUserMarker] = useState(null) // {x, y} en %

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
                        <Link to="/" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors">
                            <ChevronLeft className="w-6 h-6 text-slate-600" />
                        </Link>
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
