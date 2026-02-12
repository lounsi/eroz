import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Activity,
    Target,
    Clock,
    Trophy,
    Calendar,
    Brain,
    Loader2,
    Zap,
    TrendingUp,
    Pencil
} from 'lucide-react'
import Button from '@/components/ui/Button'
import GlobalNavigation from '@/components/GlobalNavigation'
import { useAuth } from './context/AuthContext'
import client from './api/client'

const DashboardPage = () => {
    const { user, updateUser } = useAuth()
    const [stats, setStats] = useState(null)
    const [sessions, setSessions] = useState([])
    const [weeklyActivity, setWeeklyActivity] = useState({})
    const [xpProgress, setXpProgress] = useState(null)
    const [loading, setLoading] = useState(true)
    const fileInputRef = useRef(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, sessionsRes, activityRes, xpRes] = await Promise.all([
                    client.get('/progress/stats'),
                    client.get('/progress/sessions?limit=6'),
                    client.get('/progress/weekly-activity'),
                    client.get('/progress/xp-progress'),
                ])
                setStats(statsRes.data)
                setSessions(sessionsRes.data)
                setWeeklyActivity(activityRes.data)
                setXpProgress(xpRes.data)
            } catch (error) {
                console.error('Failed to fetch progress data:', error)
            } finally {
                setLoading(false)
            }
        }
        if (user) fetchData()
    }, [user])

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const { data } = await client.post('/upload/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            // Mettre à jour l'utilisateur localement
            updateUser({ avatar: data.avatar })
        } catch (error) {
            console.error('Failed to upload avatar:', error)
            alert('Erreur lors de l\'upload de l\'image')
        }
    }

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

    const fullName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
    const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U'

    const displayStats = stats ? [
        { label: "Séries jouées", value: stats.totalSessions.toString(), icon: Brain, color: "text-medical-600", bg: "bg-medical-50" },
        { label: "Précision moy.", value: `${Math.round(stats.averageScore)}%`, icon: Target, color: "text-accent-600", bg: "bg-accent-50" },
        { label: "Temps moy.", value: formatTime(stats.averageTime), icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Série actuelle", value: `${stats.currentStreak} jour${stats.currentStreak > 1 ? 's' : ''}`, icon: Activity, color: "text-green-500", bg: "bg-green-50" },
    ] : []

    function formatTime(seconds) {
        if (!seconds) return '0m'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return mins > 0 ? `${mins}m${secs > 0 ? secs : ''}` : `${secs}s`
    }

    function formatSessionDate(dateString) {
        const date = new Date(dateString)
        const now = new Date()
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        if (diffDays === 1) return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    function getDifficultyInfo(difficulty) {
        switch (difficulty) {
            case 'EASY': return { label: 'Facile', color: 'text-green-600', bg: 'bg-green-100' }
            case 'MEDIUM': return { label: 'Moyen', color: 'text-orange-600', bg: 'bg-orange-100' }
            case 'HARD': return { label: 'Difficile', color: 'text-red-600', bg: 'bg-red-100' }
            default: return { label: difficulty, color: 'text-slate-600', bg: 'bg-slate-100' }
        }
    }

    function getLevelName(level) {
        if (level >= 20) return 'Expert'
        if (level >= 10) return 'Avancé'
        if (level >= 5) return 'Intermédiaire'
        return 'Débutant'
    }

    // Données du graphique
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const values = days.map(day => weeklyActivity[day] || 0)
    const maxValue = Math.max(...values, 1)

    // Créer les points du SVG (viewBox 300x150)
    const chartWidth = 300
    const chartHeight = 150
    const padding = 20
    const pointsData = values.map((v, i) => ({
        x: padding + (i / 6) * (chartWidth - padding * 2),
        y: chartHeight - padding - (v / maxValue) * (chartHeight - padding * 2),
        value: v
    }))

    // Path de la ligne
    const linePath = pointsData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    // Path de l'aire (fermé en bas)
    const areaPath = `${linePath} L ${pointsData[6].x} ${chartHeight - padding} L ${pointsData[0].x} ${chartHeight - padding} Z`

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
            <div className="bg-white border-b border-slate-200 pt-20 pb-8 px-4">
                <div className="container-custom">
                    <div className="mb-6">
                        <GlobalNavigation />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar avec Upload */}
                        <div
                            className="relative w-24 h-24 rounded-full group cursor-pointer ring-4 ring-white shadow-lg overflow-hidden"
                            onClick={handleAvatarClick}
                        >
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="Profil"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-medical-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white">
                                    {initials}
                                </div>
                            )}

                            {/* Overlay Edit */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil className="w-6 h-6 text-white" />
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                            />
                        </div>

                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold text-slate-800">{fullName}</h1>
                            <p className="text-slate-500 font-medium mb-3">
                                {getLevelName(xpProgress?.level || 1)} • Niveau {xpProgress?.level || 1}
                            </p>

                            <div className="flex items-center gap-3 max-w-md mx-auto md:mx-0">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>{xpProgress?.totalXp || 0} XP</span>
                                </div>
                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress?.progress || 0}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                    />
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                    {xpProgress?.currentXp || 0} / {xpProgress?.xpForNextLevel || 1000}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link to="/training">
                                <Button variant="primary" icon={Brain}>S'entraîner</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard */}
            <div className="container-custom mt-8">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats */}
                        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {displayStats.map((stat, index) => (
                                <motion.div key={index} variants={itemVariants} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Graphique en Ligne - Simple & Propre */}
                        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-medical-600" />
                                    Activité de la semaine
                                </h3>
                            </div>

                            {/* Chart SVG */}
                            <div className="relative">
                                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                                    {/* Grille horizontale */}
                                    {[0.25, 0.5, 0.75, 1].map((ratio) => (
                                        <line
                                            key={ratio}
                                            x1={padding}
                                            y1={chartHeight - padding - ratio * (chartHeight - padding * 2)}
                                            x2={chartWidth - padding}
                                            y2={chartHeight - padding - ratio * (chartHeight - padding * 2)}
                                            stroke="#e2e8f0"
                                            strokeWidth="1"
                                            strokeDasharray="4,4"
                                        />
                                    ))}

                                    {/* Aire sous la courbe */}
                                    <motion.path
                                        d={areaPath}
                                        fill="url(#areaGradient)"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 1 }}
                                    />

                                    {/* Ligne principale */}
                                    <motion.path
                                        d={linePath}
                                        fill="none"
                                        stroke="#0891b2"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />

                                    {/* Points */}
                                    {pointsData.map((point, i) => (
                                        <motion.g key={i}>
                                            <motion.circle
                                                cx={point.x}
                                                cy={point.y}
                                                r="3"
                                                fill="white"
                                                stroke="#0891b2"
                                                strokeWidth="1.5"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                                            />
                                            {/* Valeur au-dessus du point */}
                                            <motion.text
                                                x={point.x}
                                                y={point.y - 10}
                                                textAnchor="middle"
                                                fill="#0891b2"
                                                fontSize="9"
                                                fontWeight="bold"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                            >
                                                {point.value}
                                            </motion.text>
                                        </motion.g>
                                    ))}

                                    {/* Labels jours */}
                                    {days.map((day, i) => (
                                        <text
                                            key={day}
                                            x={pointsData[i].x}
                                            y={chartHeight - 4}
                                            textAnchor="middle"
                                            fill="#94a3b8"
                                            fontSize="8"
                                        >
                                            {day}
                                        </text>
                                    ))}

                                    {/* Gradient */}
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </motion.div>
                    </div>

                    {/* Historique */}
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-medical-600" />
                            Historique récent
                        </h3>

                        {sessions.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">
                                Aucun entraînement.<br />
                                <Link to="/training" className="text-medical-600 font-medium hover:underline">Commencer →</Link>
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((item) => {
                                    const diffInfo = getDifficultyInfo(item.difficulty)
                                    return (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${diffInfo.bg}`}>
                                                    <Trophy className={`w-4 h-4 ${diffInfo.color}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${diffInfo.bg} ${diffInfo.color}`}>{diffInfo.label}</span>
                                                        <span className="text-xs text-amber-600 font-medium">+{item.xpEarned} XP</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">{formatSessionDate(item.completedAt)}</p>
                                                </div>
                                            </div>
                                            <span className={`font-bold text-sm ${item.precision >= 80 ? 'text-green-600' : item.precision >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                                                {Math.round(item.precision)}%
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <Link to="/history" className="w-full mt-6 py-2 text-sm text-medical-600 font-medium hover:bg-medical-50 rounded-lg transition-colors block text-center">
                            Voir tout l'historique
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

export default DashboardPage
