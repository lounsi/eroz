import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    BookOpen,
    ArrowRight,
    Loader2,
    GraduationCap,
    Clock,
    Trophy
} from 'lucide-react'
import GlobalNavigation from '@/components/GlobalNavigation'
import { getClassDetail, getSeriesByClass } from './api/classes'

const difficultyConfig = {
    EASY: { label: 'Facile', color: 'bg-green-100 text-green-700' },
    MEDIUM: { label: 'Intermédiaire', color: 'bg-amber-100 text-amber-700' },
    HARD: { label: 'Difficile', color: 'bg-red-100 text-red-700' },
}

const StudentClassDetailPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [classroom, setClassroom] = useState(null)
    const [seriesList, setSeriesList] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [classRes, seriesRes] = await Promise.all([
                getClassDetail(id),
                getSeriesByClass(id),
            ])
            setClassroom(classRes.data)
            setSeriesList(seriesRes.data)
        } catch (err) {
            console.error('Erreur chargement', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mb-8"><GlobalNavigation /></div>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-medical-500" />
                </div>
            </div>
        )
    }

    if (!classroom) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24">
            <div><GlobalNavigation /></div>

            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate('/my-classes')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6 text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Retour à mes cours
                </button>

                <header className="mb-10 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 rounded-full bg-medical-50 text-medical-700 text-xs font-bold tracking-wide uppercase">
                                    Classe
                                </span>
                                <span className="text-slate-400 text-sm font-mono">
                                    {classroom.code}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-slate-800 mb-4">{classroom.name}</h1>
                            {classroom.description && (
                                <p className="text-slate-600 max-w-2xl leading-relaxed">{classroom.description}</p>
                            )}
                        </div>
                        <div className="hidden md:flex items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl text-slate-300">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                    </div>
                </header>

                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 px-2">
                    <BookOpen className="w-6 h-6 text-medical-600" />
                    Séries d'entraînement disponibles
                </h2>

                {seriesList.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500">Aucune série disponible pour le moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {seriesList.map((series, idx) => (
                            <motion.div
                                key={series.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all hover:translate-y-[-2px] group cursor-pointer flex flex-col h-full"
                                onClick={() => {
                                    if (series.status !== 'COMPLETED') {
                                        navigate(`/training/series/${series.id}`)
                                    }
                                }}
                            >
                                <div className={`p-6 flex flex-col h-full ${series.status === 'COMPLETED' ? 'opacity-75' : ''}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${difficultyConfig[series.difficulty]?.color || 'bg-slate-100 text-slate-600'}`}>
                                            {difficultyConfig[series.difficulty]?.label || series.difficulty}
                                        </span>
                                        {series.status === 'COMPLETED' && (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <Trophy className="w-3 h-3" /> Terminé
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-medical-600 transition-colors">
                                        {series.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-6">
                                        {series.description || "Aucune description"}
                                    </p>

                                    <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-auto">
                                        {series.status === 'COMPLETED' ? (
                                            <span className="flex items-center gap-1 text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg cursor-not-allowed">
                                                Déjà fait
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-sm font-bold text-medical-600 bg-medical-50 px-3 py-1.5 rounded-lg group-hover:bg-medical-600 group-hover:text-white transition-all">
                                                Commencer <ArrowRight className="w-4 h-4" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StudentClassDetailPage
