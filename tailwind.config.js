/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // Palette de couleurs personnalisée pour le domaine médical
            colors: {
                // Bleu médical professionnel
                medical: {
                    50: '#e6f4f9',
                    100: '#cce9f3',
                    200: '#99d3e7',
                    300: '#66bddb',
                    400: '#33a7cf',
                    500: '#0091c3',
                    600: '#0077b6', // Couleur principale
                    700: '#005f92',
                    800: '#00476d',
                    900: '#003049',
                },
                // Accent cyan moderne
                accent: {
                    50: '#e6f9fc',
                    100: '#ccf3f9',
                    200: '#99e7f3',
                    300: '#66dbed',
                    400: '#33cfe7',
                    500: '#00b4d8', // Accent principal
                    600: '#0090ad',
                    700: '#006c82',
                    800: '#004856',
                    900: '#00242b',
                },
                // Nuances de gris professionnelles
                slate: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
            },
            // Police Inter pour un rendu professionnel
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            // Animations personnalisées
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [],
}
