import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    GraduationCap,
    Users,
    BookOpen,
    ArrowRight,
    Loader2,
    Search,
    School
} from 'lucide-react'
import GlobalNavigation from '@/components/GlobalNavigation'
import { getStudentClasses, joinClassByCode } from './api/classes'

const StudentClassesPage = () => {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [joinCode, setJoinCode] = useState('')
    const [joining, setJoining] = useState(false)
    const [message, setMessage] = useState(null)
    const navigate = useNavigate()

    useEffect(() => { fetchClasses() }, [])

    const fetchClasses = async () => {
        try {
            setLoading(true)
            const { data } = await getStudentClasses()
            setClasses(data)
        } catch (err) {
            console.error('Erreur chargement cours', err)
        } finally {
            setLoading(false)
        }
    }

    const handleJoin = async (e) => {
        e.preventDefault()
        if (!joinCode.trim()) return

        try {
            setJoining(true)
            setMessage(null)
            const { data } = await joinClassByCode(joinCode.trim())
            if (data.message === 'Already enrolled') {
                setMessage({ type: 'warning', text: `Vous appartenez déjà à la classe "${data.classroomName}" !` })
            } else {
                setMessage({ type: 'success', text: `Vous avez rejoint "${data.classroomName}" avec succès !` })
                setJoinCode('')
                fetchClasses() // Rafraîchir la liste
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Code invalide ou erreur réseau'
            setMessage({ type: 'error', text: errorMsg })
        } finally {
            setJoining(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24">
            <div>
                <GlobalNavigation />
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header Section */}
                <header>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                        <School className="w-8 h-8 text-medical-600" />
                        Mes classes
                    </h1>
                    <p className="text-slate-600">
                        Accédez à vos classes et rejoignez de nouveaux cours.
                    </p>
                </header>

                {/* Join Class Section */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-slate-400" />
                        Rejoindre une classe
                    </h2>
                    <form onSubmit={handleJoin} className="flex gap-4 items-start max-w-xl">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Entrez le code de la classe (ex: RADL3024)"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm font-mono tracking-wide"
                                maxLength={8}
                            />
                            {message && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-2 text-sm font-medium ${message.type === 'success' ? 'text-green-600' : message.type === 'warning' ? 'text-amber-600' : 'text-red-500'}`}
                                >
                                    {message.text}
                                </motion.p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={joining || !joinCode.trim()}
                            className="px-6 py-3 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Rejoindre
                        </button>
                    </form>
                </section>

                {/* My Classes Grid */}
                <section>
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-medical-600" />
                        Vos inscriptions ({classes.length})
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-medical-500" />
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Vous n'êtes inscrit à aucun cours pour le moment.</p>
                            <p className="text-sm text-slate-400 mt-1">Utilisez un code ci-dessus pour rejoindre une classe.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((cls, idx) => (
                                <motion.div
                                    key={cls.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                                    onClick={() => navigate(`/my-classes/${cls.id}`)}
                                >
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-medical-600 transition-colors mb-2 line-clamp-1">
                                            {cls.name}
                                        </h3>
                                        {cls.description && (
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-[40px]">
                                                {cls.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
                                            <span className="flex items-center gap-1.5">
                                                <BookOpen className="w-4 h-4" />
                                                {cls.seriesCount} série{cls.seriesCount !== 1 ? 's' : ''}
                                            </span>
                                            <span className="flex items-center gap-1 text-medical-600 font-medium group-hover:translate-x-1 transition-transform">
                                                Ouvrir <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 px-6 py-2 text-xs text-slate-400 font-mono border-t border-slate-100 flex justify-between">
                                        <span>Code: {cls.code}</span>
                                        <span>Inscrit le {new Date(cls.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default StudentClassesPage
