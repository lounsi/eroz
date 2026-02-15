
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Calendar,
    Trophy,
    Clock,
    Target,
    Zap,
    Filter,
    Loader2,
    ArrowLeft
} from 'lucide-react'
import { useAuth } from './context/AuthContext'
import GlobalNavigation from '@/components/GlobalNavigation'
import client from './api/client'

/**
 * Page Historique complet des sessions d'entraînement
 */
const HistoryPage = () => {
    const { user } = useAuth()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL') // ALL, EASY, MEDIUM, HARD

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await client.get('/progress/sessions?limit=100')
                setSessions(data)
            } catch (error) {
                console.error('Failed to fetch sessions:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchSessions()
    }, [user])

    // Filtrer les sessions
    const filteredSessions = filter === 'ALL'
        ? sessions
        : sessions.filter(s => s.difficulty === filter)

    // Grouper par date
    const groupedSessions = filteredSessions.reduce((acc, session) => {
        const date = new Date(session.completedAt).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })
        if (!acc[date]) acc[date] = []
        acc[date].push(session)
        return acc
    }, {})

    // Helpers
    function getDifficultyInfo(difficulty) {
        switch (difficulty) {
            case 'EASY': return { label: 'Facile', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' }
            case 'MEDIUM': return { label: 'Moyen', color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' }
            case 'HARD': return { label: 'Difficile', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' }
            default: return { label: difficulty, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' }
        }
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')} `
    }

    function formatHour(dateString) {
        return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-medical-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 pt-20 pb-6 px-4">
                <div className="container-custom">
                    <div className="mb-4">
                        <GlobalNavigation />
                    </div>

                    <div className="mb-6">
                        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-medical-600 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Retour à ma progression
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-medical-600" />
                                Historique complet
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {sessions.length} session{sessions.length > 1 ? 's' : ''} d'entraînement
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {/* Filtres */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                    {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === f
                                                ? 'bg-white shadow-sm text-slate-800'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            {f === 'ALL' ? 'Tout' : f === 'EASY' ? 'Facile' : f === 'MEDIUM' ? 'Moyen' : 'Difficile'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des sessions */}
            <div className="container-custom mt-6">
                {Object.keys(groupedSessions).length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <p className="text-slate-500">Aucune session trouvée</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedSessions).map(([date, daySessions]) => (
                            <motion.div
                                key={date}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                            >
                                {/* Date Header */}
                                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                                    <h3 className="font-semibold text-slate-700 capitalize">{date}</h3>
                                </div>

                                {/* Sessions */}
                                <div className="divide-y divide-slate-100">
                                    {daySessions.map((session) => {
                                        const diffInfo = getDifficultyInfo(session.difficulty)
                                        return (
                                            <div key={session.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {/* Icône difficulté */}
                                                        <div className={`w - 12 h - 12 rounded - xl flex items - center justify - center ${diffInfo.bg} `}>
                                                            <Trophy className={`w - 5 h - 5 ${diffInfo.color} `} />
                                                        </div>

                                                        {/* Infos */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text - xs font - medium px - 2 py - 0.5 rounded ${diffInfo.bg} ${diffInfo.color} `}>
                                                                    {diffInfo.label}
                                                                </span>
                                                                <span className="text-xs text-slate-400">
                                                                    {formatHour(session.completedAt)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Target className="w-3.5 h-3.5" />
                                                                    {session.correctAnswers}/{session.totalImages} images
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {formatTime(session.duration)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Score & XP */}
                                                    <div className="text-right">
                                                        <div className={`text - lg font - bold ${session.precision >= 80 ? 'text-green-600' :
                                                            session.precision >= 50 ? 'text-orange-500' : 'text-red-500'
                                                            } `}>
                                                            {Math.round(session.precision)}%
                                                        </div>
                                                        <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                                                            <Zap className="w-3.5 h-3.5" />
                                                            +{session.xpEarned} XP
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default HistoryPage
