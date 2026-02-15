import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
    GraduationCap,
    Plus,
    Users,
    BookOpen,
    Copy,
    Check,
    Trash2,
    X,
    Loader2
} from 'lucide-react'
import GlobalNavigation from '@/components/GlobalNavigation'
import { getMyClasses, createClass, deleteClass } from './api/classes'

const ClassesPage = () => {
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [creating, setCreating] = useState(false)
    const [copiedId, setCopiedId] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => { fetchClasses() }, [])

    const fetchClasses = async () => {
        try {
            setLoading(true)
            const { data } = await getMyClasses()
            setClasses(data)
        } catch (err) {
            console.error('Erreur chargement classes', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newName.trim()) return
        try {
            setCreating(true)
            await createClass({ name: newName.trim(), description: newDesc.trim() || null })
            setNewName('')
            setNewDesc('')
            setShowCreate(false)
            fetchClasses()
        } catch (err) {
            console.error('Erreur création classe', err)
            alert('Erreur lors de la création')
        } finally {
            setCreating(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        try {
            setDeleting(true)
            await deleteClass(deleteTarget.id)
            setClasses(classes.filter(c => c.id !== deleteTarget.id))
            setDeleteTarget(null)
        } catch (err) {
            console.error('Erreur suppression', err)
        } finally {
            setDeleting(false)
        }
    }

    const copyCode = (code, id) => {
        navigator.clipboard.writeText(code)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24">
            <div>
                <GlobalNavigation />
            </div>

            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-medical-600" />
                            Gestion des classes
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Gérez vos classes, séries d'entraînement et suivez la progression.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Nouvelle classe
                    </button>
                </header>

                {/* Create Modal */}
                <AnimatePresence>
                    {showCreate && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowCreate(false)}
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
                                        <h2 className="text-xl font-bold text-slate-800">Nouvelle classe</h2>
                                        <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                            <X className="w-5 h-5 text-slate-500" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la classe *</label>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="ex: Radiologie L3 — 2024"
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Description (optionnel)</label>
                                            <textarea
                                                value={newDesc}
                                                onChange={(e) => setNewDesc(e.target.value)}
                                                placeholder="Description de la classe..."
                                                rows={3}
                                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm resize-none"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowCreate(false)}
                                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={creating}
                                                className="flex-1 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                Créer
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Classes Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-medical-500" />
                    </div>
                ) : classes.length === 0 ? (
                    <div className="text-center py-20">
                        <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">Aucune classe créée pour le moment.</p>
                        <p className="text-slate-400 text-sm mt-1">Commencez par créer votre première classe !</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((cls, idx) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
                            >
                                <div
                                    onClick={() => navigate(`/classes/${cls.id}`)}
                                    className="p-6 cursor-pointer"
                                >
                                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-medical-600 transition-colors mb-2">
                                        {cls.name}
                                    </h3>
                                    {cls.description && (
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{cls.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            {cls.studentCount} étudiant{cls.studentCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <BookOpen className="w-4 h-4" />
                                            {cls.seriesCount} série{cls.seriesCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-medium text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                            {cls.code}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); copyCode(cls.code, cls.id) }}
                                            className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                            title="Copier le code"
                                        >
                                            {copiedId === cls.id ? (
                                                <Check className="w-3.5 h-3.5 text-green-500" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(cls) }}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteTarget(null)}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
                                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-7 h-7 text-red-500" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 mb-2">Supprimer cette classe ?</h2>
                                <p className="text-sm text-slate-500 mb-6">
                                    <strong className="text-slate-700">{deleteTarget.name}</strong> et toutes ses séries seront supprimées. Cette action est irréversible.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteTarget(null)}
                                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deleting}
                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ClassesPage
