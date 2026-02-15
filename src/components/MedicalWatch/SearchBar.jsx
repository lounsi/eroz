/**
 * SearchBar - Barre de recherche avec design moderne
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, placeholder = "Rechercher un article..." }) => {
    const [value, setValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);
        onSearch(newValue);
    };

    const handleClear = () => {
        setValue('');
        onSearch('');
    };

    return (
        <motion.div
            animate={{
                boxShadow: isFocused
                    ? '0 10px 40px -10px rgba(0, 119, 182, 0.3)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            className={`
                relative flex items-center gap-3 px-5 py-4 bg-white rounded-2xl
                shadow-md transition-all duration-300
                border-2 ${isFocused ? 'border-medical-400 shadow-xl' : 'border-white'}
            `}
        >
            {/* Icône recherche */}
            <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-medical-500' : 'text-slate-400'}`} />

            {/* Input */}
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />

            {/* Bouton clear */}
            {value && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={handleClear}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                    <X className="w-4 h-4 text-slate-500" />
                </motion.button>
            )}

            {/* Indicateur de recherche */}
            {value && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-400"
                >
                    Entrée pour rechercher
                </motion.span>
            )}
        </motion.div>
    );
};

export default SearchBar;
