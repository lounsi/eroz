/**
 * Composant Button - Bouton réutilisable
 * Variantes : primary, secondary, outline
 */

import { motion } from 'framer-motion'

/**
 * Bouton personnalisé avec animations Framer Motion
 * @param {Object} props - Propriétés du composant
 * @param {string} props.variant - Variante du bouton (primary, secondary, outline)
 * @param {string} props.size - Taille du bouton (sm, md, lg)
 * @param {React.ReactNode} props.children - Contenu du bouton
 * @param {string} props.className - Classes CSS additionnelles
 * @param {function} props.onClick - Fonction de clic
 * @param {boolean} props.disabled - État désactivé
 */
const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    onClick,
    disabled = false,
    icon: Icon,
    ...props
}) => {
    // Styles de base communs à toutes les variantes
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-xl
    transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `

    // Styles par variante
    const variants = {
        primary: `
      bg-gradient-to-r from-medical-600 to-accent-500
      text-white
      hover:from-medical-700 hover:to-accent-600
      focus:ring-medical-500
      shadow-lg shadow-medical-500/25
      hover:shadow-xl hover:shadow-medical-500/30
    `,
        secondary: `
      bg-white
      text-medical-600
      border-2 border-medical-200
      hover:bg-medical-50 hover:border-medical-300
      focus:ring-medical-500
    `,
        outline: `
      bg-transparent
      text-white
      border-2 border-white/30
      hover:bg-white/10 hover:border-white/50
      focus:ring-white
    `,
    }

    // Tailles disponibles
    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    }

    return (
        <motion.button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            {...props}
        >
            {Icon && <Icon className="w-5 h-5" />}
            {children}
        </motion.button>
    )
}

export default Button
