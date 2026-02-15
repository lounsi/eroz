/**
 * PresentationPage - Page vitrine principale d'Éroz
 * Plateforme pédagogique d'imagerie médicale assistée par IA
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValueEvent, useInView } from 'framer-motion'
import {
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
    ArrowDown,
    LogOut,
    MessageSquare,

    Pencil
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import GlobalNavigation from '@/components/GlobalNavigation'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import client from '@/api/client'

/**
 * Composant principal de la page de présentation
 */
const PresentationPage = () => {
    const [scrolled, setScrolled] = useState(false)
    const { user, logout, updateUser } = useAuth()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

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
            updateUser({ avatar: data.avatar })
        } catch (error) {
            console.error('Failed to upload avatar:', error)
        }
    }

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
    const scene2InView = useInView(scene2Ref, { once: true, margin: "-20%" });
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

    // --- SCENE 5: TEAM (5500 - 7000px) ---
    const scene5Ref = useRef(null);
    const scene5InView = useInView(scene5Ref, { once: true, margin: "-20%" });
    const { scrollYProgress: s5Progress } = useScroll({ target: scene5Ref, offset: ["start end", "end start"] });
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
            {/* ========== MENU GLOBAL ========== */}
            <GlobalNavigation
                buttonClassName={`p-2.5 rounded-xl transition-all ${scrolled ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'}`}
            />

            {/* ========== HEADER FIXE ========== */}
            <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg border-b border-slate-200/50' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto flex items-center justify-center h-16 md:h-20 px-6 relative">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/assets/logo-eroz.png" alt="Logo" className="w-10 h-10 object-contain transition-transform" />
                        <span className={`font-bold text-2xl tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>Éroz</span>
                    </div>
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
                        <motion.h1 variants={fadeInUp} initial="hidden" animate="visible" className="text-7xl md:text-9xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">Éroz</motion.h1>
                        <motion.p variants={fadeInUp} initial="hidden" animate="visible" className="text-xl md:text-2xl text-slate-300 mb-12 font-medium">Une plateforme médicale innovante, <span className="text-accent-400">propulsée par l'IA.</span></motion.p>
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
                    <div className="max-w-6xl w-full flex flex-col gap-12 z-10">
                        {/* Header Row: Title & Logo */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <motion.div style={{ x: s2TitleX }} className="space-y-4 max-w-2xl">
                                <span className="text-medical-400 font-bold tracking-widest uppercase text-sm">Le Défi</span>
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">Pourquoi nous <br /><span className="text-accent-500">existons.</span></h2>
                            </motion.div>
                            <motion.div style={{ scale: s2OzScale }} className="relative flex justify-center">
                                <div className="w-40 h-40 bg-gradient-to-br from-medical-500/30 to-accent-500/30 rounded-full blur-[60px] absolute animate-pulse" />
                                <div className="relative z-10 flex items-center justify-center">
                                    <img src="/assets/logo-eroz.png" alt="Logo Éroz" className="w-full max-w-[140px] drop-shadow-[0_0_30px_rgba(30,190,230,0.5)]" />
                                </div>
                            </motion.div>
                        </div>

                        {/* 2x2 Grid: Text + 3 Arguments */}
                        {/* 2-Column Layout: Text (Left) vs Arguments (Right) */}
                        <div className="grid md:grid-cols-2 gap-6 items-stretch h-full">
                            {/* Left Col: Main Text (Enlarged + Typewriter) */}
                            <motion.div style={{ opacity: s2Opac }} className="h-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center">
                                <div className="text-xl md:text-2xl text-slate-300 font-medium leading-relaxed w-full">
                                    <RichTypewriter
                                        segments={[
                                            { text: "L’imagerie médicale guide des " },
                                            { text: "décisions thérapeutiques majeures", className: "text-white font-bold" },
                                            { text: "." },
                                            { text: "\n\nApprendre à interpréter une image exige " },
                                            { text: "rigueur", className: "text-white font-bold" },
                                            { text: ", " },
                                            { text: "répétition", className: "text-white font-bold" },
                                            { text: " et " },
                                            { text: "expérience", className: "text-white font-bold" },
                                            { text: "." },
                                            { text: "\n\nÉroz propose un espace d’entraînement structuré pour développer le " },
                                            { text: "regard clinique", className: "text-accent-400 font-bold" },
                                            { text: " avant la responsabilité réelle." }
                                        ]}
                                        trigger={scene2InView}
                                        speed={15}
                                    />
                                </div>
                            </motion.div>

                            {/* Right Col: 3 Arguments Stack */}
                            <div className="flex flex-col gap-4 h-full justify-between">
                                {/* Arg 1 */}
                                <motion.div style={{ opacity: s2Point1, x: useTransform(s2Point1, [0, 1], [-20, 0]) }} className="flex-1 flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm items-center">
                                    <div className="w-14 h-14 bg-medical-500/20 rounded-xl flex items-center justify-center flex-shrink-0"><Brain className="text-medical-400 w-7 h-7" /></div>
                                    <div><h3 className="text-white font-bold text-lg mb-1">Un pilier du diagnostic</h3><p className="text-slate-400 text-sm">L’image médicale est au cœur des décisions thérapeutiques modernes.</p></div>
                                </motion.div>

                                {/* Arg 2 */}
                                <motion.div style={{ opacity: s2Point2, x: useTransform(s2Point2, [0, 1], [-20, 0]) }} className="flex-1 flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm items-center">
                                    <div className="w-14 h-14 bg-accent-500/20 rounded-xl flex items-center justify-center flex-shrink-0"><Activity className="text-accent-400 w-7 h-7" /></div>
                                    <div><h3 className="text-white font-bold text-lg mb-1">Un apprentissage exigeant</h3><p className="text-slate-400 text-sm">L’expertise visuelle se construit par répétition et correction.</p></div>
                                </motion.div>

                                {/* Arg 3 */}
                                <motion.div style={{ opacity: s2Point3 || s2Point2, x: useTransform(s2Point2, [0, 1], [-20, 0]) }} className="flex-1 flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm items-center">
                                    <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0"><BarChart3 className="text-emerald-400 w-7 h-7" /></div>
                                    <div><h3 className="text-white font-bold text-lg mb-1">Une progression mesurable</h3><p className="text-slate-400 text-sm">S’entraîner, analyser ses écarts, progresser objectivement.</p></div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
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
                                { icon: Microscope, title: "Annotation Interactive", desc: "Délimitez les zones suspectes directement sur l’image. Développez votre capacité d’analyse.", color: "bg-violet-500", op: s3Card1 },
                                { icon: Brain, title: "Analyse Assistée par IA", desc: "Vos annotations sont comparées à une référence grâce à des métriques objectives.", color: "bg-blue-500", op: s3Card2 },
                                { icon: BarChart3, title: "Scoring & Progression", desc: "Chaque session génère un score détaillé pour identifier vos forces et vos axes d’amélioration.", color: "bg-emerald-500", op: s3Card3 },
                                { icon: Sparkles, title: "Veille Médicale", desc: "Restez informé des évolutions et innovations en imagerie médicale.", color: "bg-accent-500", op: s3Card4 }
                            ].map((card, i) => (
                                <motion.div key={i} style={{ opacity: card.op, y: useTransform(card.op, [0, 1], [30, 0]) }} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group h-full flex flex-col">
                                    <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform`}><card.icon className="text-white w-7 h-7" /></div>
                                    <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                                    <p className="text-slate-400 text-sm flex-grow">{card.desc}</p>
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
                        <div className="flex flex-wrap justify-center gap-6 mt-12 px-4">
                            {[
                                {
                                    title: "Conformité RGPD",
                                    desc: <>Respect des <strong className="text-white">principes européens</strong> de protection et de minimisation des données.</>
                                },
                                {
                                    title: "Données anonymisées",
                                    desc: <>Les images sont <strong className="text-white">dépourvues de toute information</strong> permettant d’identifier un patient.</>
                                },
                                {
                                    title: "Modèles Open Source",
                                    desc: <>Les mécanismes reposent sur des <strong className="text-white">approches transparentes</strong> et vérifiables.</>
                                },
                                {
                                    title: "Infrastructure maîtrisée",
                                    desc: <>L’architecture garantit un <strong className="text-white">contrôle total</strong> sur les données utilisées.</>
                                },
                                {
                                    title: "Sécurité des données",
                                    desc: <>Aucune <strong className="text-white">donnée sensible</strong> n’est partagée avec des services tiers.</>
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    transition={{
                                        layout: { duration: 0.6, type: "spring", stiffness: 40, damping: 15 }, // Plus fluide et "organique"
                                        scale: { duration: 0.3 }
                                    }}
                                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white font-medium backdrop-blur-sm cursor-help hover:bg-white/10 hover:border-accent-500/30 transition-colors group relative overflow-hidden flex items-center justify-center text-center min-h-[50px]"
                                >
                                    <motion.span
                                        layout="position"
                                        className="group-hover:hidden block"
                                    >
                                        {item.title}
                                    </motion.span>
                                    <motion.span
                                        layout="position"
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                        className="hidden group-hover:block text-[15px] text-slate-300 leading-snug max-w-xs"
                                    >
                                        {item.desc}
                                    </motion.span>
                                </motion.div>
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
                    <div className="text-center mb-16 px-4">
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">L'Équipe derrière <span className="text-medical-600">Éroz</span></h2>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                            className="text-slate-500 text-lg max-w-3xl mx-auto font-medium"
                        >
                            {/* Typewriter Effect Simple */}
                            <Typewriter
                                text="Éroz est développé par une équipe de 4 étudiants en Data Science et Intelligence Artificielle. Notre objectif : créer un outil pédagogique rigoureux, moderne et accessible."
                                trigger={scene5InView}
                            />
                        </motion.div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto px-4">
                        {[
                            { name: "Data Science", desc: "Analyse des données, structuration des cas et suivi de progression.", icon: Server },
                            { name: "Intelligence Artificielle", desc: "Modélisation, scoring et comparaison des annotations.", icon: Brain },
                            { name: "Product / UX", desc: "Conception d’une expérience pédagogique claire et intuitive.", icon: Users }
                        ].map((m, i) => (
                            <div key={i} className="text-center group">
                                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-medical-500 to-accent-500 rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform"><m.icon className="w-12 h-12 text-white" /></div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{m.name}</h3>
                                <p className="text-slate-500 font-medium px-4">{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
                <footer className="w-full border-t border-slate-100 py-8 bg-white z-20">
                    <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3"><img src="/assets/logo-eroz.png" alt="Logo" className="w-10 h-10" /><div><span className="font-bold text-slate-900 block">Éroz</span><span className="text-xs text-slate-400">© 2026 - Projet académique</span></div></div>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-600">
                            {(() => {
                                let links = []
                                if (!user) {
                                    links = [
                                        { name: "Accueil", href: "/" },
                                        { name: "Connexion", href: "/login" },
                                        { name: "Inscription", href: "/register" },
                                        { name: "Nous contacter", href: "/contact" }
                                    ]
                                } else if (user.role === 'STUDENT') {
                                    links = [
                                        { name: "Accueil", href: "/" },
                                        { name: "Mes classes", href: "/my-classes" },
                                        { name: "S'entraîner", href: "/training" },
                                        { name: "Veille Médicale", href: "/medical-watch" },
                                        { name: "Progression", href: "/history" },
                                        { name: "Nous contacter", href: "/contact" }
                                    ]
                                } else if (user.role === 'PROF') {
                                    links = [
                                        { name: "Accueil", href: "/" },
                                        { name: "Gestion des classes", href: "/classes" },
                                        { name: "Veille Médicale", href: "/medical-watch" },
                                        { name: "Nous contacter", href: "/contact" }
                                    ]
                                } else if (user.role === 'ADMIN') {
                                    links = [
                                        { name: "Accueil", href: "/" },
                                        { name: "Administration", href: "/admin/users" },
                                        { name: "Gestion des classes", href: "/classes" },
                                        { name: "S'entraîner", href: "/training" },
                                        { name: "Veille Médicale", href: "/medical-watch" },
                                        { name: "Progression", href: "/history" },
                                        { name: "Nous contacter", href: "/contact" }
                                    ]
                                }

                                return links.map(l => (
                                    <Link key={l.name} to={l.href} className="hover:text-medical-600 transition-colors">{l.name}</Link>
                                ))
                            })()}
                        </div>
                    </div>
                </footer>
            </section>
        </div>
    )
}

// Helper Component for Typewriter Effect
const Typewriter = ({ text, speed = 30, trigger = true }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!trigger) return;
        let index = 0;
        const intervalId = setInterval(() => {
            setDisplayedText((prev) => {
                if (index >= text.length) {
                    clearInterval(intervalId);
                    return prev;
                }
                return text.slice(0, index + 1);
            });
            index++;
        }, speed);
        return () => clearInterval(intervalId);
    }, [text, trigger, speed]);

    return <span>{displayedText}</span>;
};

// Helper Component for Rich Typewriter Effect (Supports array of segments with styles)
const RichTypewriter = ({ segments, speed = 30, trigger = true }) => {
    const [charIndex, setCharIndex] = useState(0);
    const totalChars = segments.reduce((acc, seg) => acc + seg.text.length, 0);

    useEffect(() => {
        if (!trigger) return;
        const interval = setInterval(() => {
            setCharIndex((prev) => (prev < totalChars ? prev + 1 : prev));
        }, speed);
        return () => clearInterval(interval);
    }, [trigger, speed, totalChars]);

    let currentGlobalIndex = 0;

    return (
        <span className="whitespace-pre-wrap">
            {segments.map((seg, i) => {
                const start = currentGlobalIndex;
                currentGlobalIndex += seg.text.length;

                return (
                    <span key={i} className={seg.className || ""}>
                        {seg.text.split('').map((char, charLocalIndex) => {
                            const globalPos = start + charLocalIndex;
                            return (
                                <span key={charLocalIndex} style={{ opacity: globalPos < charIndex ? 1 : 0 }}>
                                    {char}
                                </span>
                            );
                        })}
                    </span>
                );
            })}
        </span>
    );
};

export default PresentationPage
