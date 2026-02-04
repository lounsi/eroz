import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    User,
    Activity,
    Target,
    Clock,
    ChevronLeft,
    Trophy,
    Calendar,
    Brain,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'

/**
 * Page Dashboard - Mon Compte
 * Données entièrement mockées pour la démo
 */
const DashboardPage = () => {
    // Données utilisateur mockées
    const user = {
        name: "Thomas Martin",
        role: "Étudiant - 4ème année",
        avatar: "TM",
        level: "Intermédiaire",
        xp: 2450,
        nextLevel: 3000
    }

    // Stats globales
    const stats = [
        { label: "Cas résolus", value: "42", icon: Brain, color: "text-medical-600", bg: "bg-medical-50" },
        { label: "Précision moy.", value: "85%", icon: Target, color: "text-accent-600", bg: "bg-accent-50" },
        { label: "Temps / Cas", value: "2m15", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Série actuelle", value: "5 jours", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
    ]

    // Historique récent
    const history = [
        { id: 1, type: "IRM Cérébrale", date: "Aujourd'hui, 10:30", score: 95, status: "success" },
        { id: 2, type: "Radio Thorax", date: "Hier, 14:15", score: 72, status: "warning" },
        { id: 3, type: "Scanner Abdo", date: "25 Jan, 09:45", score: 88, status: "success" },
        { id: 4, type: "Radio Osseuse", date: "22 Jan, 16:20", score: 45, status: "error" },
        { id: 5, type: "IRM Genou", date: "20 Jan, 11:10", score: 92, status: "success" },
    ]

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header / Bannière User */}
            <div className="bg-white border-b border-slate-200 pt-20 pb-8 px-4">
                <div className="container-custom">
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-medical-600 transition-colors mb-6 text-sm font-medium">
                        <ChevronLeft className="w-4 h-4" />
                        Retour à l'accueil
                    </Link>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-medical-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white">
                            {user.avatar}
                        </div>

                        {/* Infos */}
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold text-slate-800">{user.name}</h1>
                            <p className="text-slate-500 font-medium mb-2">{user.role}</p>

                            {/* Barre d'XP */}
                            <div className="flex items-center gap-3 max-w-sm mx-auto md:mx-0">
                                <span className="text-xs font-bold text-medical-600 bg-medical-50 px-2 py-0.5 rounded">Niv. {user.level}</span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-medical-500 to-accent-400 rounded-full"
                                        style={{ width: `${(user.xp / user.nextLevel) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-slate-400">{user.xp} / {user.nextLevel} XP</span>
                            </div>
                        </div>

                        {/* CTA Action */}
                        <div className="flex gap-3">
                            <Link to="/training">
                                <Button variant="primary" icon={Brain}>
                                    S'entraîner
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu Dashboard */}
            <div className="container-custom mt-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-3 gap-8"
                >
                    {/* Colonne Gauche (Stats + Graph) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Cartes de Stats */}
                        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
                                >
                                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Graphique d'activité (Mock CSS) */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-medical-600" />
                                    Activité de la semaine
                                </h3>
                                <select className="text-sm text-slate-500 bg-slate-50 border-none rounded-lg p-2 outline-none">
                                    <option>Cette semaine</option>
                                    <option>Mois dernier</option>
                                </select>
                            </div>

                            {/* Graphique Barres */}
                            <div className="h-48 flex items-end justify-between gap-2 px-2">
                                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
                                    // Hauteurs aléatoires simulées
                                    const heights = [40, 65, 30, 85, 55, 20, 45]
                                    return (
                                        <div key={day} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                            <div className="w-full bg-slate-100 rounded-t-lg h-full relative overflow-hidden group-hover:bg-slate-200 transition-colors">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${heights[i]}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                    className="absolute bottom-0 w-full bg-medical-500 rounded-t-lg group-hover:bg-medical-600 transition-colors"
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{day}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* Colonne Droite (Historique) */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit"
                    >
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-medical-600" />
                            Historique récent
                        </h3>

                        <div className="space-y-4">
                            {history.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center
                                            ${item.status === 'success' ? 'bg-green-100 text-green-600' :
                                                item.status === 'warning' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-red-100 text-red-600'}
                                        `}>
                                            <Trophy className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{item.type}</p>
                                            <p className="text-xs text-slate-500">{item.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold text-sm ${item.score >= 80 ? 'text-green-600' :
                                                item.score >= 50 ? 'text-orange-500' : 'text-red-500'
                                            }`}>
                                            {item.score}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-2 text-sm text-medical-600 font-medium hover:bg-medical-50 rounded-lg transition-colors">
                            Voir tout l'historique
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

export default DashboardPage
