/**
 * PresentationPage - Page vitrine principale d'Éroz
 * Plateforme pédagogique d'imagerie médicale assistée par IA
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Menu,
    X,
    ChevronRight,
    Brain,
    Shield,
    Target,
    BarChart3,
    Users,
    Lock,
    Server,
    Eye,
    Microscope,
    GraduationCap,
    Activity,
    CheckCircle2,
    Sparkles
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

/**
 * Composant principal de la page de présentation
 */
const PresentationPage = () => {
    // État du menu latéral
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    // Détection du scroll pour l'effet du header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Animation variants pour Framer Motion
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' }
        }
    }

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    }

    // Données des fonctionnalités
    const features = [
        {
            icon: Microscope,
            title: "Annotation d'images",
            description: "Identifiez et annotez les zones suspectes sur des images médicales réelles anonymisées."
        },
        {
            icon: Brain,
            title: "Analyse par IA",
            description: "Bénéficiez d'un feedback instantané grâce à notre modèle d'intelligence artificielle."
        },
        {
            icon: BarChart3,
            title: "Scoring pédagogique",
            description: "Évaluez vos performances avec un système de notation précis et détaillé."
        },
        {
            icon: Activity,
            title: "Suivi de progression",
            description: "Visualisez votre évolution et identifiez vos axes d'amélioration."
        }
    ]

    // Données des valeurs et sécurité
    const securityFeatures = [
        {
            icon: Shield,
            title: "Conforme RGPD",
            description: "Respect total de la réglementation européenne sur la protection des données."
        },
        {
            icon: Lock,
            title: "Données anonymisées",
            description: "Toutes les images médicales sont rigoureusement anonymisées avant utilisation."
        },
        {
            icon: Server,
            title: "IA Open Source",
            description: "Nos modèles sont transparents, auditables et basés sur des technologies ouvertes."
        },
        {
            icon: Eye,
            title: "Souveraineté",
            description: "Hébergement souverain des données sur infrastructure française."
        }
    ]

    // Données de l'équipe
    const teamMembers = [
        {
            name: "Équipe Data Science",
            role: "Développement IA & Modèles",
            description: "Conception des algorithmes de détection et d'analyse d'images médicales."
        },
        {
            name: "Équipe Développement",
            role: "Architecture & Frontend",
            description: "Création de l'interface utilisateur et de l'infrastructure technique."
        },
        {
            name: "Équipe Produit",
            role: "UX & Pédagogie",
            description: "Conception de l'expérience d'apprentissage et validation pédagogique."
        }
    ]

    // Liens de navigation dynamiques
    const getNavLinks = () => {
        const links = [{ name: "Accueil", href: "/" }];

        if (user) {
            links.push({ name: "Mon Compte", href: "/account" });

            if (user.role === 'STUDENT' || user.role === 'ADMIN') {
                links.push({ name: "S'entraîner", href: "/training" });
                links.push({ name: "Veille Médicale", href: "/medical-watch" });
            }

            if (user.role === 'PROF' || user.role === 'ADMIN') {
                links.push({ name: "Création d'entraînement", href: "/create-training" });
            }

            if (user.role === 'ADMIN') {
                links.push({ name: "Gestion Utilisateurs", href: "/admin/users" });
            }
        } else {
            links.push({ name: "Connexion", href: "/login" });
            links.push({ name: "Inscription", href: "/register" });
        }

        links.push({ name: "Nous contacter", href: "/contact" });
        return links;
    };

    const navLinks = getNavLinks();

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ========== MENU LATÉRAL ========== */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
                        />

                        {/* Menu */}
                        <motion.nav
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 flex flex-col"
                        >
                            {/* En-tête du menu */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/assets/logo-eroz.png"
                                        alt="Logo Éroz"
                                        className="w-10 h-10 object-contain"
                                    />
                                    <span className="font-bold text-xl text-slate-800">Éroz</span>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                    aria-label="Fermer le menu"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Liens de navigation */}
                            <div className="flex-1 py-6">
                                {navLinks.map((link, index) => (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-medical-600 hover:bg-medical-50 transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                        <span className="font-medium">{link.name}</span>
                                    </Link>
                                ))}
                                {user && (
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition-all text-left"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                        <span className="font-medium">Déconnexion</span>
                                    </button>
                                )}
                            </div>

                            {/* Pied du menu */}
                            <div className="p-6 border-t border-slate-100">
                                <p className="text-xs text-slate-400 text-center">
                                    Projet de Fin d'Études RNCP<br />
                                    Data & Intelligence Artificielle
                                </p>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>

            {/* ========== HEADER FIXE ========== */}
            <header
                className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${scrolled
                    ? 'bg-white/90 backdrop-blur-md shadow-md'
                    : 'bg-transparent'
                    }`}
            >
                <div className="container-custom flex items-center justify-between h-16 md:h-20">
                    {/* Bouton menu */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className={`p-2 rounded-lg transition-colors ${scrolled
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-white/10 text-white'
                            }`}
                        aria-label="Ouvrir le menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Logo central */}
                    <div className="flex items-center gap-2">
                        <img
                            src="/assets/logo-eroz.png"
                            alt="Logo Éroz"
                            className="w-12 h-12 object-contain"
                        />
                        <span className={`font-bold text-xl ${scrolled ? 'text-slate-800' : 'text-white'}`}>
                            Éroz
                        </span>
                    </div>

                    {/* Espace réservé pour alignement */}
                    <div className="w-10" />
                </div>
            </header>

            {/* ========== HERO SECTION ========== */}
            <section
                id="hero"
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
            >
                {/* Image de fond avec overlay */}
                <div className="absolute inset-0">
                    <img
                        src="/assets/banner-hero.jpg"
                        alt="Imagerie médicale"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-medical-900/90 via-medical-800/80 to-slate-900/90" />

                    {/* Motif décoratif */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-medical-400 rounded-full blur-3xl" />
                    </div>
                </div>

                {/* Contenu Hero */}
                <div className="relative z-10 container-custom text-center px-4">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Badge */}
                        <motion.div variants={fadeInUp} className="mb-6">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-accent-300 text-sm font-medium border border-white/20">
                                <Sparkles className="w-4 h-4" />
                                Plateforme pédagogique innovante
                            </span>
                        </motion.div>

                        {/* Titre principal */}
                        <motion.h1
                            variants={fadeInUp}
                            className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight"
                        >
                            Éroz
                        </motion.h1>

                        {/* Phrase d'accroche */}
                        <motion.p
                            variants={fadeInUp}
                            className="text-xl md:text-2xl text-slate-200 mb-10 leading-relaxed max-w-2xl mx-auto"
                        >
                            Plateforme d'entraînement à l'imagerie médicale assistée par intelligence artificielle
                        </motion.p>

                        {/* Boutons CTA */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Button variant="primary" size="lg" icon={Target}>
                                S'entraîner
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                icon={ChevronRight}
                                onClick={() => document.getElementById('why').scrollIntoView({ behavior: 'smooth' })}
                            >
                                Découvrir
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Indicateur de scroll */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2"
                    >
                        <div className="w-1.5 h-3 bg-white/50 rounded-full" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ========== SECTION POURQUOI ========== */}
            <section id="why" className="section-padding bg-white">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="max-w-4xl mx-auto"
                    >
                        {/* En-tête de section */}
                        <motion.div variants={fadeInUp} className="text-center mb-16">
                            <span className="badge badge-primary mb-4">Notre mission</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                                Pourquoi ce projet existe
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Former les médecins de demain à l'interprétation d'images médicales,
                                un enjeu majeur pour la qualité des soins.
                            </p>
                        </motion.div>

                        {/* Contenu */}
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* Illustration */}
                            <motion.div variants={fadeInUp} className="relative">
                                <div className="aspect-square rounded-3xl bg-gradient-to-br from-medical-100 to-accent-100 p-8 flex items-center justify-center">
                                    <img
                                        src="/assets/oz-mascot.png"
                                        alt="Mascotte Éroz"
                                        className="w-3/4 h-3/4 object-contain drop-shadow-xl"
                                    />
                                </div>
                                {/* Décoration */}
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent-500 rounded-2xl -z-10 opacity-20" />
                            </motion.div>

                            {/* Points clés */}
                            <motion.div variants={staggerContainer} className="space-y-6">
                                {[
                                    {
                                        icon: GraduationCap,
                                        title: "L'imagerie médicale, un pilier du diagnostic",
                                        content: "IRM, scanners, radiographies : ces examens sont essentiels pour établir des diagnostics précis et orienter les traitements."
                                    },
                                    {
                                        icon: Activity,
                                        title: "Un apprentissage complexe et exigeant",
                                        content: "L'interprétation d'images médicales requiert des années de pratique. Chaque erreur peut avoir des conséquences significatives."
                                    },
                                    {
                                        icon: Target,
                                        title: "Le besoin d'un entraînement encadré",
                                        content: "Les étudiants ont besoin de s'exercer sur des cas réels, avec un feedback immédiat et personnalisé pour progresser efficacement."
                                    }
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        variants={fadeInUp}
                                        className="flex gap-4"
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 bg-medical-100 rounded-xl flex items-center justify-center">
                                            <item.icon className="w-6 h-6 text-medical-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                                            <p className="text-slate-600 text-sm leading-relaxed">{item.content}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ========== SECTION FONCTIONNALITÉS ========== */}
            <section id="features" className="section-padding bg-slate-50">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                    >
                        {/* En-tête */}
                        <motion.div variants={fadeInUp} className="text-center mb-16">
                            <span className="badge badge-accent mb-4">Fonctionnalités</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                                Comment fonctionne Éroz
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Une approche pédagogique innovante combinant pratique active
                                et intelligence artificielle pour un apprentissage optimal.
                            </p>
                        </motion.div>

                        {/* Grille de fonctionnalités */}
                        <motion.div
                            variants={staggerContainer}
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeInUp}
                                    className="card-hover p-6"
                                >
                                    {/* Icône */}
                                    <div className="w-14 h-14 bg-gradient-to-br from-medical-500 to-accent-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-medical-500/20">
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>

                                    {/* Contenu */}
                                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Étapes du processus */}
                        <motion.div
                            variants={fadeInUp}
                            className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-lg"
                        >
                            <h3 className="text-xl font-bold text-slate-800 mb-8 text-center">
                                Votre parcours d'apprentissage
                            </h3>

                            <div className="grid md:grid-cols-4 gap-6">
                                {[
                                    { step: "01", title: "Sélection", desc: "Choisissez un module et un type d'imagerie" },
                                    { step: "02", title: "Annotation", desc: "Identifiez les zones d'intérêt sur l'image" },
                                    { step: "03", title: "Analyse IA", desc: "Recevez un feedback détaillé et personnalisé" },
                                    { step: "04", title: "Progression", desc: "Suivez vos résultats et améliorez-vous" }
                                ].map((item, index) => (
                                    <div key={index} className="relative">
                                        <div className="text-5xl font-extrabold text-medical-100 mb-2">
                                            {item.step}
                                        </div>
                                        <h4 className="font-semibold text-slate-800 mb-1">{item.title}</h4>
                                        <p className="text-sm text-slate-600">{item.desc}</p>

                                        {/* Ligne de connexion */}
                                        {index < 3 && (
                                            <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-medical-200 to-transparent -z-10" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ========== SECTION SÉCURITÉ ========== */}
            <section id="security" className="section-padding bg-gradient-to-br from-medical-800 to-slate-900 text-white">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                    >
                        {/* En-tête */}
                        <motion.div variants={fadeInUp} className="text-center mb-16">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-accent-300 text-sm font-medium mb-4">
                                <Shield className="w-4 h-4" />
                                Confiance & Sécurité
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Valeurs & Sécurité
                            </h2>
                            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                                La protection des données et la transparence sont au cœur de notre démarche.
                                Nous nous engageons à respecter les plus hauts standards de sécurité.
                            </p>
                        </motion.div>

                        {/* Grille de sécurité */}
                        <motion.div
                            variants={staggerContainer}
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {securityFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeInUp}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                                >
                                    {/* Icône */}
                                    <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-accent-400" />
                                    </div>

                                    {/* Contenu */}
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-200 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Badges de confiance */}
                        <motion.div
                            variants={fadeInUp}
                            className="mt-12 flex flex-wrap justify-center gap-4"
                        >
                            {["RGPD", "Données anonymisées", "Open Source", "Hébergement FR"].map((badge, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-accent-400" />
                                    <span>{badge}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ========== SECTION ÉQUIPE ========== */}
            <section id="team" className="section-padding bg-white">
                <div className="container-custom">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                    >
                        {/* En-tête */}
                        <motion.div variants={fadeInUp} className="text-center mb-16">
                            <span className="badge badge-primary mb-4">Notre équipe</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">
                                Une équipe dédiée
                            </h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Étudiants passionnés en Data Science et Intelligence Artificielle,
                                unis par la volonté de créer un outil utile au monde médical.
                            </p>
                        </motion.div>

                        {/* Membres de l'équipe */}
                        <motion.div
                            variants={staggerContainer}
                            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
                        >
                            {teamMembers.map((member, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeInUp}
                                    className="text-center"
                                >
                                    {/* Avatar placeholder */}
                                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-medical-400 to-accent-400 rounded-2xl flex items-center justify-center">
                                        <Users className="w-10 h-10 text-white" />
                                    </div>

                                    <h3 className="font-semibold text-slate-800 mb-1">
                                        {member.name}
                                    </h3>
                                    <p className="text-sm text-medical-600 font-medium mb-2">
                                        {member.role}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {member.description}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Note projet académique */}
                        <motion.div
                            variants={fadeInUp}
                            className="mt-16 text-center"
                        >
                            <div className="inline-flex items-center gap-3 px-6 py-4 bg-slate-100 rounded-2xl">
                                <GraduationCap className="w-6 h-6 text-medical-600" />
                                <div className="text-left">
                                    <p className="font-semibold text-slate-800">Projet de Fin d'Études RNCP</p>
                                    <p className="text-sm text-slate-600">Data Science & Intelligence Artificielle</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ========== FOOTER ========== */}
            <footer className="bg-slate-900 text-slate-400 py-12">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Logo et copyright */}
                        <div className="flex items-center gap-3">
                            <img
                                src="/assets/logo-eroz.png"
                                alt="Logo Éroz"
                                className="w-8 h-8 object-contain opacity-80"
                            />
                            <div>
                                <span className="font-semibold text-white">Éroz</span>
                                <p className="text-xs">© 2026 - Projet académique</p>
                            </div>
                        </div>

                        {/* Liens rapides */}
                        <div className="flex gap-6 text-sm">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className="hover:text-white transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>


                    </div>
                </div>
            </footer>
        </div>
    )
}

export default PresentationPage
