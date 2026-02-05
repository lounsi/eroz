/**
 * MedicalWatchPage - Page de veille médicale refaite
 * Affiche les dernières actualités médicales en temps réel
 * Sources: PubMed API + RSS Feeds
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Newspaper,
    RefreshCw,
    TrendingUp,
    Clock,
    Sparkles,
    BookOpen,
    Zap,
    Filter,
    LayoutGrid,
    List,
    AlertCircle,
    Loader2
} from 'lucide-react';

// Composants
import ArticleCard from '@/components/MedicalWatch/ArticleCard';
import CategoryFilter from '@/components/MedicalWatch/CategoryFilter';
import SearchBar from '@/components/MedicalWatch/SearchBar';

// API
import { fetchAllMedicalNews, getFeaturedArticles, searchArticles, CATEGORIES } from '@/api/medicalNews';

const MedicalWatchPage = () => {
    // États
    const [news, setNews] = useState({});
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [featuredArticles, setFeaturedArticles] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    // Charger les actualités
    const loadNews = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const data = await fetchAllMedicalNews();
            setNews(data);
            setFeaturedArticles(getFeaturedArticles(data));
            setLastUpdate(new Date());

            // Appliquer le filtre actuel
            updateFilteredArticles(data, activeCategory, searchTerm);
        } catch (err) {
            console.error('Erreur chargement news:', err);
            setError('Impossible de charger les actualités. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [activeCategory, searchTerm]);

    // Mettre à jour les articles filtrés
    const updateFilteredArticles = (data, category, search) => {
        if (!data || Object.keys(data).length === 0) {
            setFilteredArticles([]);
            return;
        }

        let articles = [];

        if (search) {
            articles = searchArticles(data, search);
        } else if (category === 'all') {
            // Tous les articles, fusionnés
            for (const [key, cat] of Object.entries(data)) {
                if (cat.articles) {
                    articles.push(
                        ...cat.articles.map(a => ({
                            ...a,
                            categoryInfo: {
                                name: cat.name,
                                gradient: cat.gradient,
                                icon: cat.icon
                            }
                        }))
                    );
                }
            }
            // Trier par date (les plus récents en premier si possible)
            articles.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
        } else if (data[category]) {
            const cat = data[category];
            articles = (cat.articles || []).map(a => ({
                ...a,
                categoryInfo: {
                    name: cat.name,
                    gradient: cat.gradient,
                    icon: cat.icon
                }
            }));
        }

        setFilteredArticles(articles);
    };

    // Effet initial
    useEffect(() => {
        loadNews();
    }, []);

    // Auto-refresh toutes les 12 heures
    useEffect(() => {
        const interval = setInterval(() => {
            loadNews(true);
        }, 12 * 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [loadNews]);

    // Gérer le changement de catégorie
    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        setSearchTerm('');
        updateFilteredArticles(news, category, '');
    };

    // Gérer la recherche
    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term) {
            setActiveCategory('all');
        }
        updateFilteredArticles(news, term ? 'all' : activeCategory, term);
    };

    // Statistiques
    const totalArticles = Object.values(news).reduce(
        (acc, cat) => acc + (cat.articles?.length || 0),
        0
    );

    return (
        <div className="min-h-screen bg-white">
            {/* ========== HERO SECTION ========== */}
            <section className="relative overflow-hidden">
                {/* Background avec motifs */}
                <div className="absolute inset-0 bg-gradient-to-br from-medical-800 via-medical-700 to-slate-900">
                    {/* Cercles décoratifs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-medical-400/10 rounded-full blur-3xl" />

                    {/* Pattern grid */}
                    <div
                        className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                            backgroundSize: '40px 40px'
                        }}
                    />
                </div>

                <div className="relative container-custom py-12 md:py-20">
                    {/* Navigation */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-8"
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition-all backdrop-blur-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="font-medium">Retour</span>
                        </Link>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >

                        {/* Titre */}
                        <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                                <Newspaper className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                                    Veille Médicale
                                </h1>
                                <p className="text-medical-200 text-lg mt-1">
                                    Restez à la pointe de la recherche médicale
                                </p>
                            </div>
                        </motion.div>

                        {/* Description */}
                        <motion.p
                            variants={fadeInUp}
                            className="text-slate-300 text-lg max-w-2xl mb-8"
                        >
                            Découvrez les dernières avancées en imagerie médicale, intelligence artificielle,
                            oncologie et recherche. Des articles scientifiques sélectionnés pour vous.
                        </motion.p>

                        {/* Stats */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-wrap gap-6"
                        >
                            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                <BookOpen className="w-5 h-5 text-accent-400" />
                                <div>
                                    <p className="text-2xl font-bold text-white">{totalArticles}</p>
                                    <p className="text-xs text-slate-400">Articles</p>
                                </div>
                            </div>
                            {lastUpdate && (
                                <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <Clock className="w-5 h-5 text-cyan-400" />
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-xs text-slate-400">Dernière mise à jour</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Courbe décorative */}
                <div className="absolute bottom-[-1px] left-0 right-0 z-10">
                    <svg viewBox="0 0 1440 80" fill="none" className="w-full block">
                        <path
                            d="M0 80L48 74.7C96 69 192 59 288 53.3C384 48 480 48 576 53.3C672 59 768 69 864 69.3C960 69 1056 59 1152 53.3C1248 48 1344 48 1392 48L1440 48V80H1392C1344 80 1248 80 1152 80C1056 80 960 80 864 80C768 80 672 80 576 80C480 80 384 80 288 80C192 80 96 80 48 80H0Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* ========== CONTENU PRINCIPAL ========== */}
            <section className="container-custom py-12">
                {/* Barre d'outils */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-10 space-y-6"
                >
                    {/* Recherche */}
                    <div className="max-w-2xl mx-auto">
                        <SearchBar
                            onSearch={handleSearch}
                            placeholder="Rechercher un article, un auteur, un sujet..."
                        />
                    </div>

                    {/* Filtres et actions */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Filtres catégories */}
                        <CategoryFilter
                            categories={news}
                            activeCategory={activeCategory}
                            onCategoryChange={handleCategoryChange}
                        />

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {/* Toggle view */}
                            <div className="flex items-center bg-white rounded-xl shadow-md p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                                        ? 'bg-medical-500 text-white'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                                        ? 'bg-medical-500 text-white'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Refresh */}
                            <button
                                onClick={() => loadNews(true)}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-xl shadow-md text-slate-600 font-medium transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Actualiser</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* État de chargement */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20"
                    >
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-medical-200 rounded-full" />
                            <div className="absolute inset-0 w-20 h-20 border-4 border-medical-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="mt-6 text-slate-600 font-medium">Chargement des actualités...</p>
                    </motion.div>
                )}

                {/* État d'erreur */}
                {error && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-16 px-6 bg-red-50 rounded-3xl border border-red-100"
                    >
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-red-700 font-medium text-center">{error}</p>
                        <button
                            onClick={() => loadNews()}
                            className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                        >
                            Réessayer
                        </button>
                    </motion.div>
                )}

                {/* Contenu principal */}
                {!isLoading && !error && (
                    <>
                        {/* Section À la une (seulement si pas de recherche et catégorie "all") */}
                        {!searchTerm && activeCategory === 'all' && featuredArticles.length > 0 && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={staggerContainer}
                                className="mb-16"
                            >
                                <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800">À la une</h2>
                                </motion.div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {featuredArticles.map((article, index) => (
                                        <ArticleCard
                                            key={article.id}
                                            article={article}
                                            index={index}
                                            featured={true}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Liste des articles */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            {/* Header section */}
                            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-medical-100 rounded-xl">
                                        <Filter className="w-5 h-5 text-medical-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            {searchTerm
                                                ? `Résultats pour "${searchTerm}"`
                                                : activeCategory === 'all'
                                                    ? 'Tous les articles'
                                                    : news[activeCategory]?.name || 'Articles'
                                            }
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Grille d'articles */}
                            {filteredArticles.length > 0 ? (
                                <div className={
                                    viewMode === 'grid'
                                        ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                                        : 'flex flex-col gap-4'
                                }>
                                    <AnimatePresence>
                                        {filteredArticles.map((article, index) => (
                                            <ArticleCard
                                                key={article.id}
                                                article={article}
                                                index={index}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-16 text-center"
                                >
                                    <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                                    <p className="text-xl font-medium text-slate-600 mb-2">
                                        Aucun article trouvé
                                    </p>
                                    <p className="text-slate-400">
                                        Essayez de modifier vos critères de recherche
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    </>
                )}
            </section>

            {/* ========== FOOTER INFO ========== */}
            <section className="bg-white">
                <div className="container-custom py-8 border-t border-slate-50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span>Données actualisées automatiquement toutes les 12 heures</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Sources : HAS, ANSM, INSERM, Google News, PubMed</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MedicalWatchPage;
