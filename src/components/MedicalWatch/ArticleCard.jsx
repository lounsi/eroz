/**
 * ArticleCard - Carte d'article pour la veille médicale
 * Design moderne avec animations et effets visuels
 */

import { motion } from 'framer-motion';
import { ExternalLink, Clock, BookOpen, Users, Sparkles } from 'lucide-react';
import { formatRelativeDate } from '@/api/medicalNews';

const ArticleCard = ({ article, index = 0, featured = false }) => {
    const {
        title,
        abstract,
        authors,
        journal,
        publishedDate,
        url,
        source,
        categoryInfo,
        thumbnail
    } = article;

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                delay: index * 0.1,
                ease: 'easeOut'
            }
        }
    };

    if (featured) {
        // Version "À la une" - Grande carte
        return (
            <motion.article
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500"
            >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${categoryInfo?.gradient || 'from-medical-500 to-accent-500'} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Badge catégorie */}
                <div className="absolute top-4 left-4 z-10">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg bg-gradient-to-r ${categoryInfo?.gradient || 'from-medical-500 to-accent-500'}`}>
                        <Sparkles className="w-4 h-4" />
                        {categoryInfo?.name || 'Actualité'}
                    </span>
                </div>

                {/* Thumbnail ou gradient placeholder */}
                <div className="h-48 relative overflow-hidden">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${categoryInfo?.gradient || 'from-slate-200 to-slate-300'} opacity-20`}>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <BookOpen className="w-16 h-16 text-slate-300" />
                            </div>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Contenu */}
                <div className="p-6">
                    {/* Source & Date */}
                    <div className="flex items-center gap-3 mb-3 text-sm">
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-600 font-medium">
                            {source}
                        </span>
                        {article.lang === 'en' && (
                            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-[10px] font-bold text-white/60 uppercase tracking-tighter border border-white/10">
                                EN
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {formatRelativeDate(publishedDate)}
                        </span>
                    </div>

                    {/* Titre */}
                    <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-medical-600 transition-colors">
                        {title}
                    </h3>

                    {/* Abstract */}
                    <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                        {abstract}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Users className="w-4 h-4" />
                            <span className="line-clamp-1">{authors}</span>
                        </div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                            Lire
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </motion.article>
        );
    }

    // Version standard - Carte compacte
    return (
        <motion.article
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100"
        >
            {/* Accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${categoryInfo?.gradient || 'from-medical-500 to-accent-500'}`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${categoryInfo?.gradient || 'from-medical-500 to-accent-500'}`}>
                            {categoryInfo?.name || source}
                        </span>
                        {article.lang === 'en' && (
                            <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                EN
                            </span>
                        )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {formatRelativeDate(publishedDate)}
                    </span>
                </div>

                {/* Titre */}
                <h3 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-medical-600 transition-colors">
                    {title}
                </h3>

                {/* Journal */}
                <p className="text-xs text-slate-500 mb-3 line-clamp-1">
                    {journal}
                </p>

                {/* Abstract */}
                <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                    {abstract}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 line-clamp-1 max-w-[60%]">
                        {authors}
                    </span>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-medical-600 hover:text-medical-700 text-sm font-medium transition-colors"
                    >
                        Lire
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>
        </motion.article>
    );
};

export default ArticleCard;
