import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Loader2,
    BookOpen,
    Users,
    CheckCircle2,
    Clock,
    MinusCircle,
    BarChart3,
    Target,
    Trash2
} from 'lucide-react'
import GlobalNavigation from '@/components/GlobalNavigation'
import { getSeriesDetail, getSeriesProgress, deleteSeries } from './api/classes'

const difficultyConfig = {
    EASY: { label: 'Facile', color: 'bg-green-100 text-green-700 border-green-200' },
    MEDIUM: { label: 'Intermédiaire', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    HARD: { label: 'Difficile', color: 'bg-red-100 text-red-700 border-red-200' },
}

const statusConfig = {
    COMPLETED: { label: 'Terminé', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
    IN_PROGRESS: { label: 'En cours', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    NOT_STARTED: { label: 'Non commencé', icon: MinusCircle, color: 'text-slate-400 bg-slate-50 border-slate-200' },
}

const SeriesDetailPage = () => {
    const { id, seriesId } = useParams()
    const navigate = useNavigate()
    const [series, setSeries] = useState(null)
    const [progress, setProgress] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [seriesId])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [seriesRes, progressRes] = await Promise.all([
                getSeriesDetail(seriesId),
                getSeriesProgress(seriesId),
            ])
            setSeries(seriesRes.data)
            setProgress(progressRes.data)
        } catch (err) {
            console.error('Erreur chargement', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Supprimer cette série ? Cette action est irréversible.')) return
        setDeleting(true)
        try {
            await deleteSeries(seriesId)
            navigate(`/classes/${id}`)
        } catch (err) {
            console.error('Erreur suppression', err)
            alert('Erreur lors de la suppression')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 pt-24">
                <div><GlobalNavigation /></div>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-medical-500" />
                </div>
            </div>
        )
    }

    if (!series) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 pt-24">
                <div><GlobalNavigation /></div>
                <div className="text-center py-20">
                    <p className="text-slate-500 text-lg">Série introuvable.</p>
                </div>
            </div>
        )
    }

    const completedCount = progress.filter(p => p.status === 'COMPLETED').length
    const inProgressCount = progress.filter(p => p.status === 'IN_PROGRESS').length
    const notStartedCount = progress.filter(p => p.status === 'NOT_STARTED').length
    const avgPrecision = completedCount > 0
        ? (progress.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.precision || 0), 0) / completedCount).toFixed(1)
        : '—'
    const avgScore = completedCount > 0
        ? Math.round(progress.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + (p.score || 0), 0) / completedCount)
        : '—'

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24">
            <div>
                <GlobalNavigation />
            </div>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => navigate(`/classes/${id}`)} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Retour à la classe
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-medical-600" />
                                {series.title}
                            </h1>
                            {series.description && (
                                <p className="text-slate-600 mt-2">{series.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyConfig[series.difficulty]?.color}`}>
                                    {difficultyConfig[series.difficulty]?.label}
                                </span>
                                <span className="text-xs text-slate-400">{series.images?.length || 0} image{(series.images?.length || 0) !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Suppression...' : 'Supprimer'}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <Users className="w-3.5 h-3.5" /> Étudiants
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{progress.length}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 text-green-600 text-xs font-medium mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Terminés
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{completedCount}/{progress.length}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <Target className="w-3.5 h-3.5" /> Précision moy.
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{avgPrecision}{avgPrecision !== '—' ? '%' : ''}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
                            <BarChart3 className="w-3.5 h-3.5" /> Score moy.
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{avgScore}</p>
                    </motion.div>
                </div>

                {/* Progress Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-semibold text-slate-700">Progression des étudiants</h2>
                    </div>
                    {progress.length === 0 ? (
                        <div className="text-center py-16">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">Aucun étudiant inscrit dans cette classe.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-sm">Étudiant</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-sm">Statut</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-sm">Précision</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-sm">Score</th>
                                    <th className="px-6 py-3 font-semibold text-slate-600 text-sm">Terminé le</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {progress.map((p, idx) => {
                                    const cfg = statusConfig[p.status] || statusConfig.NOT_STARTED
                                    const StatusIcon = cfg.icon
                                    return (
                                        <motion.tr
                                            key={p.studentId}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-3">
                                                <span className="font-medium text-slate-800">{p.firstName} {p.lastName}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-slate-700">
                                                {p.precision !== null ? `${p.precision}%` : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-slate-700">
                                                {p.score !== null ? p.score : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 text-sm">
                                                {p.completedAt ? new Date(p.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SeriesDetailPage
