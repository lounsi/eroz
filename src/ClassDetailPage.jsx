import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft,
    BookOpen,
    Users,
    Plus,
    Copy,
    Check,
    Trash2,
    X,
    Loader2,
    GraduationCap,
    Signal,
    SignalLow,
    SignalMedium,
    SignalHigh
} from 'lucide-react'
import GlobalNavigation from '@/components/GlobalNavigation'
import { getClassDetail, deleteClass } from './api/classes'
import { createSeries, deleteSeries, getSeriesByClass } from './api/classes'

const difficultyConfig = {
    EASY: { label: 'Facile', color: 'bg-green-100 text-green-700 border-green-200' },
    MEDIUM: { label: 'Intermédiaire', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    HARD: { label: 'Difficile', color: 'bg-red-100 text-red-700 border-red-200' },
}

const ClassDetailPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [classroom, setClassroom] = useState(null)
    const [seriesList, setSeriesList] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('series')
    const [showCreateSeries, setShowCreateSeries] = useState(false)
    const [copiedId, setCopiedId] = useState(null)

    // Create series form
    const [seriesTitle, setSeriesTitle] = useState('')
    const [seriesDesc, setSeriesDesc] = useState('')
    const [seriesDiff, setSeriesDiff] = useState('MEDIUM')
    const [creatingSeries, setCreatingSeries] = useState(false)

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

    const handleCreateSeries = async (e) => {
        e.preventDefault()
        if (!seriesTitle.trim()) return
        try {
            setCreatingSeries(true)
            await createSeries({
                title: seriesTitle.trim(),
                description: seriesDesc.trim() || null,
                difficulty: seriesDiff,
                classroomId: parseInt(id),
            })
            setSeriesTitle('')
            setSeriesDesc('')
            setSeriesDiff('MEDIUM')
            setShowCreateSeries(false)
            fetchData()
        } catch (err) {
            console.error('Erreur création série', err)
            alert('Erreur lors de la création')
        } finally {
            setCreatingSeries(false)
        }
    }

    const handleDeleteSeries = async (sid) => {
        if (!window.confirm('Supprimer cette série ? Cette action est irréversible.')) return
        try {
            await deleteSeries(sid)
            setSeriesList(prev => prev.filter(s => s.id !== sid))
        } catch (err) {
            console.error('Erreur suppression', err)
            alert('Erreur lors de la suppression de la série')
        }
    }

    const copyCode = (code, cid) => {
        navigator.clipboard.writeText(code)
        setCopiedId(cid)
        setTimeout(() => setCopiedId(null), 2000)
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

    if (!classroom) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mb-8"><GlobalNavigation /></div>
                <div className="text-center py-20">
                    <p className="text-slate-500 text-lg">Classe introuvable.</p>
                    <Link to="/classes" className="text-medical-600 hover:underline mt-2 inline-block">← Retour aux classes</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="mb-8">
                <GlobalNavigation />
            </div>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => navigate('/classes')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4 text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux classes
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                                <GraduationCap className="w-8 h-8 text-medical-600" />
                                {classroom.name}
                            </h1>
                            {classroom.description && (
                                <p className="text-slate-600 mt-2">{classroom.description}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                Code : {classroom.code}
                            </span>
                            <button
                                onClick={() => copyCode(classroom.code, 'class')}
                                className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200 shadow-sm bg-white"
                                title="Copier le code"
                            >
                                {copiedId === 'class' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-slate-200 w-fit">
                    <button
                        onClick={() => setActiveTab('series')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'series' ? 'bg-medical-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Séries ({seriesList.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-medical-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Étudiants ({classroom.students?.length || 0})
                        </span>
                    </button>
                </div>

                {/* Series Tab */}
                {activeTab === 'series' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowCreateSeries(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-medium transition-colors text-sm shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Nouvelle série
                            </button>
                        </div>

                        {seriesList.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Aucune série dans cette classe.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {seriesList.map((series, idx) => (
                                    <motion.div
                                        key={series.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <div
                                            onClick={() => navigate(`/classes/${id}/series/${series.id}`)}
                                            className="p-5 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-base font-bold text-slate-800 pr-2">{series.title}</h3>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${difficultyConfig[series.difficulty]?.color || 'bg-slate-100 text-slate-600'}`}>
                                                    {difficultyConfig[series.difficulty]?.label || series.difficulty}
                                                </span>
                                            </div>
                                            {series.description && (
                                                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{series.description}</p>
                                            )}
                                            <p className="text-xs text-slate-400">{series.imageCount} image{series.imageCount !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="px-5 pb-3 flex justify-end">
                                            <button
                                                onClick={() => handleDeleteSeries(series.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Supprimer la série"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {!classroom.students || classroom.students.length === 0 ? (
                            <div className="text-center py-16">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Aucun étudiant inscrit.</p>
                                <p className="text-sm text-slate-400 mt-1">Partagez le code <strong>{classroom.code}</strong> à vos étudiants pour qu'ils rejoignent la classe.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Nom</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Prénom</th>
                                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {classroom.students.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 font-medium text-slate-900">{s.lastName}</td>
                                            <td className="px-6 py-3 text-slate-700">{s.firstName}</td>
                                            <td className="px-6 py-3 text-slate-500">{s.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Create Series Modal */}
                <AnimatePresence>
                    {showCreateSeries && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowCreateSeries(false)}
                                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed inset-0 flex items-center justify-center z-50 p-4"
                            >
                                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-slate-800">Nouvelle série</h2>
                                        <button onClick={() => setShowCreateSeries(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                            <X className="w-5 h-5 text-slate-500" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleCreateSeries} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
                                            <input
                                                type="text"
                                                value={seriesTitle}
                                                onChange={(e) => setSeriesTitle(e.target.value)}
                                                placeholder="ex: Anatomie cérébrale — Coupes axiales"
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                            <textarea
                                                value={seriesDesc}
                                                onChange={(e) => setSeriesDesc(e.target.value)}
                                                placeholder="Description de la série..."
                                                rows={3}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Difficulté</label>
                                            <select
                                                value={seriesDiff}
                                                onChange={(e) => setSeriesDiff(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm"
                                            >
                                                <option value="EASY">Facile</option>
                                                <option value="MEDIUM">Intermédiaire</option>
                                                <option value="HARD">Difficile</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateSeries(false)}
                                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={creatingSeries}
                                                className="flex-1 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {creatingSeries ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                Créer
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default ClassDetailPage
