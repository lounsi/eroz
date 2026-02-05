/**
 * PresentationPage - Page vitrine principale d'Éroz
 * Plateforme pédagogique d'imagerie médicale assistée par IA
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion'
import {
    Menu,
    X,
    ChevronRight,
    Brain,
    Shield,
    Target,
    BarChart3,
    Users,
    Microscope,
    GraduationCap,
    Activity,
    Sparkles,
    Server,
    Mouse,
    ArrowDown
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

/**
 * Composant principal de la page de présentation
 */
const PresentationPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' }
        }
    }

    // --- SCENE 1: HERO (0 - 1500px) ---
    const scene1Ref = useRef(null);
    const { scrollYProgress: s1Progress } = useScroll({ target: scene1Ref, offset: ["start start", "end end"] });
    const s1Spring = useSpring(s1Progress, { stiffness: 100, damping: 30 });
    const s1LogoY = useTransform(s1Spring, [0, 1], ["0%", "50%"]);
    const s1BgY = useTransform(s1Spring, [0, 1], ["0%", "20%"]);
    const s1FrontY = useTransform(s1Spring, [0, 1], ["0%", "-40%"]); // Fast parallax for icons
    const s1Opac = useTransform(s1Spring, [0.85, 1], [1, 0]);
    const s1Scale = useTransform(s1Spring, [0.85, 1], [1, 1.3]);
    const s1Blur = useTransform(s1Spring, [0.85, 1], ["blur(0px)", "blur(20px)"]);

    // --- SCENE 2: POURQUOI (1500 - 3000px) ---
    const scene2Ref = useRef(null);
    const { scrollYProgress: s2Progress } = useScroll({ target: scene2Ref, offset: ["start start", "end end"] });
    const s2Spring = useSpring(s2Progress, { stiffness: 50, damping: 20 });
    const s2Opac = useTransform(s2Spring, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
    const s2TitleX = useTransform(s2Spring, [0, 0.2], [-50, 0]);
    const s2OzScale = useTransform(s2Spring, [0.1, 0.4], [0.8, 1]);
    const s2Point1 = useTransform(s2Spring, [0.4, 0.5], [0, 1]);
    const s2Point2 = useTransform(s2Spring, [0.5, 0.6], [0, 1]);
    const s2Point3 = useTransform(s2Spring, [0.6, 0.7], [0, 1]);
    const s2SymbolScale = useTransform(s2Spring, [0, 1], [0.8, 1.2]);
    const s2SymbolRotate = useTransform(s2Spring, [0, 1], [0, 15]);

    // --- SCENE 3: FONCTIONNALITÉS (3000 - 5000px) ---
    const scene3Ref = useRef(null);
    const { scrollYProgress: s3Progress } = useScroll({ target: scene3Ref, offset: ["start start", "end end"] });
    const s3Spring = useSpring(s3Progress, { stiffness: 50, damping: 20 });
    const s3Opac = useTransform(s3Spring, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
    const s3Card1 = useTransform(s3Spring, [0.2, 0.3], [0, 1]);
    const s3Card2 = useTransform(s3Spring, [0.3, 0.4], [0, 1]);
    const s3Card3 = useTransform(s3Spring, [0.4, 0.5], [0, 1]);
    const s3Card4 = useTransform(s3Spring, [0.5, 0.6], [0, 1]);
    const s3SymbolY = useTransform(s3Spring, [0, 1], ["10%", "-10%"]);

    // --- SCENE 4: SÉCURITÉ ---
    const scene4Ref = useRef(null);
    const { scrollYProgress: s4Progress } = useScroll({ target: scene4Ref, offset: ["start start", "end end"] });
    const s4Spring = useSpring(s4Progress, { stiffness: 50, damping: 20 });
    const s4Opac = useTransform(s4Spring, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
    const s4ShieldScale = useTransform(s4Spring, [0, 0.5], [0.5, 1.2]);
    const s4ShieldRotate = useTransform(s4Spring, [0, 1], [0, 45]);

    // --- SCENE 5: TEAM ---
    const scene5Ref = useRef(null);
    const { scrollYProgress: s5Progress } = useScroll({ target: scene5Ref, offset: ["start start", "end end"] });
    const s5Spring = useSpring(s5Progress, { stiffness: 50, damping: 20 });
    const s5Opac = useTransform(s5Spring, [0, 0.1], [0, 1]);
    const s5UsersScale = useTransform(s5Spring, [0, 1], [1, 0.8]);

    // Reliable Header sync: Opaque only when Section 5 reaches the top
    useEffect(() => {
        const handleScroll = () => {
            if (!scene5Ref.current) return;
            const rect = scene5Ref.current.getBoundingClientRect();
            // Pass to white only when Section 5 top touches the header
            setScrolled(rect.top <= 64); // 64-80px is the header height
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Liens de navigation dynamiques
    const getNavLinks = () => {
        const links = [{ name: "Accueil", href: "/" }];
        if (user) {
            links.push({ name: "Mon Compte", href: "/account" });
            if (user.role === 'STUDENT' || user.role === 'ADMIN') {
                links.push({ name: "S'entraîner", href: "/training" });
                links.push({ name: "Veille Médicale", href: "/medical-watch" });
            }
            if (user.role === 'PROF' || user.role === 'ADMIN') links.push({ name: "Création d'entraînement", href: "/create-training" });
            if (user.role === 'ADMIN') links.push({ name: "Gestion Utilisateurs", href: "/admin/users" });
        } else {
            links.push({ name: "Connexion", href: "/login" }, { name: "Inscription", href: "/register" });
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

    /**
     * Precise scroll helper to land exactly where content is fully revealed (approx 50% scroll progress)
     */
    const scrollToSection = (ref) => {
        if (!ref.current) return;
        const sectionTop = ref.current.offsetTop;
        const sectionHeight = ref.current.offsetHeight;
        const viewportHeight = window.innerHeight;

        // Target the point where content is fully visible (near the end of the scroll range)
        // 0.8 ensures the next "Suivant" button is also triggered/visible
        const targetY = sectionTop + (sectionHeight - viewportHeight) * 0.8;

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* ========== MENU LATÉRAL ========== */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" />
                        <motion.nav initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-[60] flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <div className="flex items-center gap-3"><img src="/assets/logo-eroz.png" alt="Logo" className="w-10 h-10 object-contain" /><span className="font-bold text-xl text-slate-800">Éroz</span></div>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                            </div>
                            <div className="flex-1 py-6">
                                {navLinks.map((link) => (
                                    <Link key={link.name} to={link.href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-6 py-3 text-slate-600 hover:text-medical-600 hover:bg-medical-50 transition-all">
                                        <ChevronRight className="w-4 h-4 opacity-50" /><span className="font-medium">{link.name}</span>
                                    </Link>
                                ))}
                                {user && (
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition-all text-left font-medium">
                                        <ChevronRight className="w-4 h-4 opacity-50" /><span>Déconnexion</span>
                                    </button>
                                )}
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>

            {/* ========== HEADER FIXE ========== */}
            <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/50' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-between h-16 md:h-20 px-6">
                    <button onClick={() => setIsMenuOpen(true)} className={`p-2.5 rounded-xl transition-all ${scrolled ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'}`}><Menu size={24} /></button>
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/assets/logo-eroz.png" alt="Logo" className="w-10 h-10 object-contain transition-transform" />
                        <span className={`font-bold text-2xl tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>Éroz</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            {/* ========== SCÈNE 1: L'ÉVEIL (HERO) ========== */}
            <section ref={scene1Ref} className="relative h-[250vh] bg-slate-950">
                <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
                    <motion.div style={{ y: s1BgY, opacity: s1Opac, filter: s1Blur }} className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-medical-950 via-medical-900 to-slate-950" />
                        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent-500/10 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-medical-500/10 rounded-full blur-[100px]" />
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '60px 60px' }} />
                    </motion.div>
                    {/* Flying Icons */}
                    <motion.div style={{ y: s1FrontY, opacity: s1Opac }} className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                        <div className="absolute top-[15%] left-[10%] text-white/10 rotate-12"><Microscope size={120} /></div>
                        <div className="absolute top-[10%] right-[15%] text-accent-400/10 -rotate-12"><Brain size={180} /></div>
                        <div className="absolute bottom-[25%] right-[5%] text-white/10 rotate-45"><Activity size={100} /></div>
                        <div className="absolute bottom-[10%] left-[20%] text-medical-400/10 -rotate-12"><Sparkles size={80} /></div>
                    </motion.div>
                    {/* Neural Mesh */}
                    <motion.div style={{ opacity: s1Opac, filter: s1Blur }} className="absolute inset-0 z-10 flex items-center justify-center opacity-20 pointer-events-none">
                        <svg width="100%" height="100%" viewBox="0 0 1000 1000" className="w-full h-full scale-110">
                            {[...Array(20)].map((_, i) => (
                                <motion.circle key={i} cx={Math.random() * 1000} cy={Math.random() * 1000} r={Math.random() * 3 + 1} fill="currentColor" className="text-accent-400" animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }} />
                            ))}
                        </svg>
                    </motion.div>
                    <motion.div style={{ y: s1LogoY, opacity: s1Opac, scale: s1Scale, filter: s1Blur }} className="relative z-30 text-center px-4">
                        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6"><span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-accent-300 text-sm font-medium border border-white/20">Plateforme pédagogique innovante</span></motion.div>
                        <motion.h1 variants={fadeInUp} initial="hidden" animate="visible" className="text-7xl md:text-9xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">Éroz</motion.h1>
                        <motion.p variants={fadeInUp} initial="hidden" animate="visible" className="text-xl md:text-2xl text-slate-300 mb-12 font-medium">L'avenir de l'imagerie médicale <span className="text-accent-400">propulsé par l'IA.</span></motion.p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <Button variant="primary" size="lg" icon={Target} onClick={() => navigate('/training')}>S'entraîner</Button>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="lg" icon={ChevronRight} className="text-white" onClick={() => scrollToSection(scene2Ref)}>Découvrir</Button>
                                <motion.div animate={{ y: [0, 8, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-white/40 hidden md:block">
                                    <Mouse size={28} strokeWidth={1.5} />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ========== SCÈNE 2: LE DÉFI (POURQUOI) ========== */}
            <section ref={scene2Ref} id="why" className="relative h-[300vh] bg-slate-950">
                <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4">
                    <motion.div style={{ scale: s2SymbolScale, rotate: s2SymbolRotate }} className="absolute opacity-5 pointer-events-none">
                        <Target size={700} strokeWidth={0.5} className="text-white" />
                    </motion.div>
                    <motion.div style={{ opacity: s2Opac }} className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center z-10">
                        <div className="space-y-8">
                            <motion.div style={{ x: s2TitleX }} className="space-y-4">
                                <span className="text-medical-400 font-bold tracking-widest uppercase text-sm">Le Défi</span>
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">Pourquoi nous <br /><span className="text-accent-500">existons.</span></h2>
                                <p className="text-slate-400 text-lg">Former les médecins de demain à l'interprétation d'images est un enjeu de santé majeur.</p>
                            </motion.div>
                            <div className="space-y-6">
                                <motion.div style={{ opacity: s2Point1, x: useTransform(s2Point1, [0, 1], [-20, 0]) }} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                                    <div className="w-12 h-12 bg-medical-500/20 rounded-xl flex items-center justify-center"><GraduationCap className="text-medical-400" /></div>
                                    <div><h3 className="text-white font-bold">Un Pilier du Diagnostic</h3><p className="text-slate-500 text-sm">Vital pour orienter les traitements.</p></div>
                                </motion.div>
                                <motion.div style={{ opacity: s2Point2, x: useTransform(s2Point2, [0, 1], [-20, 0]) }} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm">
                                    <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center"><Activity className="text-accent-400" /></div>
                                    <div><h3 className="text-white font-bold">Apprentissage Exigeant</h3><p className="text-slate-500 text-sm">Des années de pratique nécessaires.</p></div>
                                </motion.div>
                            </div>
                        </div>
                        <motion.div style={{ scale: s2OzScale }} className="relative flex justify-center">
                            <div className="w-80 h-80 bg-gradient-to-br from-medical-500/30 to-accent-500/30 rounded-full blur-[100px] absolute animate-pulse" />
                            <div className="relative z-10 flex items-center justify-center">
                                <img src="/assets/logo-eroz.png" alt="Logo Éroz" className="w-full max-w-[280px] drop-shadow-[0_0_50px_rgba(30,190,230,0.5)]" />
                            </div>
                        </motion.div>
                    </motion.div>
                    {/* Guided Navigation Button */}
                    <motion.button
                        style={{ opacity: useTransform(s2Spring, [0.7, 0.9], [0, 1]) }}
                        onClick={() => scrollToSection(scene3Ref)}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group text-white/50 hover:text-accent-400 transition-colors"
                    >
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Suivant</span>
                        <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center group-hover:border-accent-400/50 group-hover:bg-accent-500/10 transition-all">
                            <ArrowDown size={18} className="group-hover:translate-y-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>
            </section>

            {/* ========== SCÈNE 3: LA MAÎTRISE (FONCTIONNALITÉS) ========== */}
            <section ref={scene3Ref} id="features" className="relative h-[300vh] bg-slate-900">
                <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4">
                    <motion.div style={{ y: s3SymbolY }} className="absolute opacity-[0.03] pointer-events-none">
                        <BarChart3 size={900} strokeWidth={0.2} className="text-accent-500" />
                    </motion.div>
                    <motion.div style={{ opacity: s3Opac }} className="max-w-6xl w-full z-10">
                        <div className="text-center mb-16 space-y-4">
                            <span className="text-accent-500 font-bold tracking-widest uppercase text-sm">Fonctionnement</span>
                            <h2 className="text-5xl md:text-7xl font-black text-white">Technologie & <span className="text-medical-400">Pédagogie</span></h2>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: Microscope, title: "Annotation", color: "bg-violet-500", op: s3Card1 },
                                { icon: Brain, title: "Analyse IA", color: "bg-blue-500", op: s3Card2 },
                                { icon: BarChart3, title: "Scoring", color: "bg-emerald-500", op: s3Card3 },
                                { icon: Activity, title: "Suivi", color: "bg-accent-500", op: s3Card4 }
                            ].map((card, i) => (
                                <motion.div key={i} style={{ opacity: card.op, y: useTransform(card.op, [0, 1], [30, 0]) }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group">
                                    <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform`}><card.icon className="text-white w-7 h-7" /></div>
                                    <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                                    <p className="text-slate-400 text-sm">Solution avancée pour l'apprentissage assisté.</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    {/* Guided Navigation Button */}
                    <motion.button
                        style={{ opacity: useTransform(s3Spring, [0.7, 0.9], [0, 1]) }}
                        onClick={() => scrollToSection(scene4Ref)}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group text-white/50 hover:text-medical-400 transition-colors"
                    >
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Continuer</span>
                        <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center group-hover:border-medical-400/50 group-hover:bg-medical-500/10 transition-all">
                            <ArrowDown size={18} className="group-hover:translate-y-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>
            </section>

            {/* ========== SCÈNE 4: SÉCURITÉ & VALEURS ========== */}
            <section ref={scene4Ref} id="security" className="relative h-[200vh] bg-slate-950">
                <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
                    <motion.div style={{ scale: s4ShieldScale, rotate: s4ShieldRotate }} className="absolute opacity-10"><Shield size={800} strokeWidth={0.5} className="text-accent-500" /></motion.div>
                    <motion.div style={{ opacity: s4Opac }} className="text-center z-10 space-y-8 px-4">
                        <div className="p-4 bg-accent-500/20 backdrop-blur-xl rounded-full inline-flex border border-accent-500/30 mb-8"><Shield className="text-accent-400 w-12 h-12" /></div>
                        <h2 className="text-6xl md:text-8xl font-black text-white leading-tight">Souveraineté & <br /><span className="text-accent-500">Confiance.</span></h2>
                        <div className="flex flex-wrap justify-center gap-6 mt-12">
                            {["Conforme RGPD", "Anonymisation Totale", "Modèles Open Source", "Hébergement France"].map((val, i) => (
                                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white font-medium backdrop-blur-sm">{val}</motion.div>
                            ))}
                        </div>
                    </motion.div>
                    {/* Guided Navigation Button */}
                    <motion.button
                        style={{ opacity: useTransform(s4Spring, [0.7, 0.9], [0, 1]) }}
                        onClick={() => scene5Ref.current.scrollIntoView({ behavior: 'smooth' })}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group text-white/50 hover:text-accent-400 transition-colors"
                    >
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">L'Équipe</span>
                        <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center group-hover:border-accent-400/50 group-hover:bg-accent-500/10 transition-all">
                            <ArrowDown size={18} className="group-hover:translate-y-1 transition-transform" />
                        </div>
                    </motion.button>
                </div>
            </section>

            {/* ========== SCÈNE 5: L'ÉQUIPE & FOOTER ========== */}
            <section ref={scene5Ref} id="team" className="relative min-h-screen bg-white flex flex-col">
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
                    <motion.div style={{ scale: s5UsersScale }} className="absolute -right-20 top-32"><Users size={600} strokeWidth={1} className="text-medical-900" /></motion.div>
                </div>
                <motion.div style={{ opacity: s5Opac }} className="container-custom pt-64 pb-20 relative z-10 flex-grow">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">L'Équipe derrière <span className="text-medical-600">Éroz</span></h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Étudiants en Data Science, unis pour l'innovation médicale.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {[{ name: "Data Science", icon: Brain }, { name: "Software Dev", icon: Server }, { name: "Product / UX", icon: Users }].map((m, i) => (
                            <div key={i} className="text-center group">
                                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-medical-500 to-accent-500 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform"><m.icon className="w-12 h-12 text-white" /></div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{m.name}</h3>
                                <p className="text-slate-500 font-medium">Conception & Développement des solutions IA.</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
                <footer className="w-full border-t border-slate-100 py-8 bg-white z-20">
                    <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3"><img src="/assets/logo-eroz.png" alt="Logo" className="w-10 h-10" /><div><span className="font-bold text-slate-900 block">Éroz</span><span className="text-xs text-slate-400">© 2026 - Projet académique</span></div></div>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-600">
                            {navLinks.filter(l => ["Accueil", "S'entraîner", "Nous contacter"].includes(l.name)).map(l => (
                                <Link key={l.name} to={l.href} className="hover:text-medical-600 transition-colors">{l.name}</Link>
                            ))}
                        </div>
                    </div>
                </footer>
            </section>
        </div>
    )
}

export default PresentationPage
