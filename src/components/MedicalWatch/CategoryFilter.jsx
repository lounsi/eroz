/**
 * CategoryFilter - Filtres par catégorie avec design moderne
 */

import { motion } from 'framer-motion';
import { Microscope, Scan, Heart, FlaskConical, Layers, Brain } from 'lucide-react';

// Mapping des icônes par catégorie
const ICON_MAP = {
    Microscope: Microscope,
    Scan: Scan,
    Heart: Heart,
    FlaskConical: FlaskConical,
    Brain: Brain,
    All: Layers
};

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
    // Ajouter l'option "Tous"
    const allCategories = [
        {
            key: 'all',
            name: 'Tous',
            icon: 'All',
            gradient: 'from-slate-500 to-slate-600',
            count: Object.values(categories).reduce((acc, cat) => acc + (cat.articles?.length || 0), 0)
        },
        ...Object.entries(categories).map(([key, cat]) => ({
            key,
            ...cat,
            count: cat.articles?.length || 0
        }))
    ];

    return (
        <div className="flex flex-wrap gap-3 justify-center">
            {allCategories.map((category) => {
                const Icon = ICON_MAP[category.icon] || Layers;
                const isActive = activeCategory === category.key;

                return (
                    <motion.button
                        key={category.key}
                        onClick={() => onCategoryChange(category.key)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            relative flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm
                            transition-all duration-300 overflow-hidden
                            ${isActive
                                ? 'text-white shadow-lg'
                                : 'bg-white text-slate-600 hover:bg-slate-50 shadow-md border border-slate-100'
                            }
                        `}
                    >
                        {/* Background gradient pour état actif */}
                        {isActive && (
                            <motion.div
                                layoutId="activeCategory"
                                className={`absolute inset-0 bg-gradient-to-r ${category.gradient}`}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}

                        {/* Contenu */}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                            <span>{category.name}</span>
                            <span className={`
                                px-2 py-0.5 rounded-full text-xs font-bold
                                ${isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }
                            `}>
                                {category.count}
                            </span>
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
};

export default CategoryFilter;
