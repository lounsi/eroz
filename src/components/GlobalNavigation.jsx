import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Menu,
    X,
    ChevronRight,
    MessageSquare,
    LogOut
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const GlobalNavigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const getNavLinks = () => {
        const links = [{ name: "Accueil", href: "/" }];
        if (user) {
            if (user.role === 'STUDENT' || user.role === 'ADMIN') {
                links.push({ name: "Veille Médicale", href: "/medical-watch" });
                links.push({ name: "S'entraîner", href: "/training" });
            }
            links.push({ name: "Progression", href: "/account" });
            if (user.role === 'PROF' || user.role === 'ADMIN') {
                links.push({ name: "Création d'entraînement", href: "/create-training" });
            }
            if (user.role === 'ADMIN') {
                links.push({ name: "Gestion Utilisateurs", href: "/admin/users" });
            }
        } else {
            links.push({ name: "Connexion", href: "/login" }, { name: "Inscription", href: "/register" });
        }
        return links;
    };

    const navLinks = getNavLinks();

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/');
    };

    return (
        <>
            {/* Burger Button */}
            <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-all border border-slate-200 bg-white shadow-sm"
                title="Ouvrir le menu"
            >
                <Menu size={20} />
            </button>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
                        />
                        <motion.nav
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-[70] flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    {user ? (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-medical-500 to-accent-500 flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white shadow-sm">
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 leading-tight">{user.firstName} {user.lastName?.toUpperCase() || ''}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <img src="/assets/logo-eroz.png" alt="Logo" className="w-10 h-10 object-contain" />
                                            <span className="font-bold text-xl text-slate-800">Éroz</span>
                                        </>
                                    )}
                                </div>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="flex-1 py-6 flex flex-col justify-between overflow-y-auto">
                                {/* Navigation Links */}
                                <div>
                                    <div className="mb-4 space-y-1">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.name}
                                                to={link.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-medical-600 hover:bg-medical-50 transition-all font-medium border-l-4 border-transparent hover:border-medical-500"
                                            >
                                                <ChevronRight className="w-4 h-4 opacity-50" />
                                                <span>{link.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Links */}
                                <div>
                                    <div className="px-4 mb-3">
                                        <Link
                                            to="/contact"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-600 hover:text-medical-600 transition-all border border-slate-100 group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <MessageSquare className="w-4 h-4 text-medical-500" />
                                            </div>
                                            <span className="font-semibold text-sm">Nous contacter</span>
                                        </Link>
                                    </div>

                                    {user && (
                                        <div className="border-t border-slate-100 pt-4 pb-6 mt-2">
                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition-all text-left font-medium">
                                                <LogOut className="w-4 h-4 opacity-50" />
                                                <span>Déconnexion</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

export default GlobalNavigation
