import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm, ValidationError } from '@formspree/react'
import { ChevronLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

/**
 * Page de Contact - Formspree
 * Remplace "YOUR_FORMSPREE_ID" par ton ID réel
 */
const ContactPage = () => {
    // Hook Formspree - ID configuré
    const [state, handleSubmit] = useForm("xnjdwnbg")

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    }

    if (state.succeeded) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center"
                >
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Message envoyé !</h2>
                    <p className="text-slate-600 mb-8">
                        Merci de nous avoir contactés. Nous reviendrons vers vous très rapidement.
                    </p>
                    <Link to="/">
                        <Button variant="primary" icon={ChevronLeft}>
                            Retour à l'accueil
                        </Button>
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="h-screen bg-gradient-to-br from-medical-900 via-medical-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
            {/* Décoration d'arrière-plan */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-medical-400 rounded-full blur-3xl" />
            </div>

            <div className="container-custom w-full max-h-screen">
                {/* Header Page */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="mb-12"
                >
                    <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
                        <ChevronLeft className="w-5 h-5" />
                        Retour à l'accueil
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Nous contacter</h1>
                    <p className="text-xl text-slate-200 max-w-2xl">
                        Une question, une suggestion ou simplement envie d'échanger ?
                        Remplissez ce formulaire et nous vous répondrons.
                    </p>
                </motion.div>

                {/* Formulaire */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-2xl mx-auto"
                >
                    <div className="p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nom */}
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                                    Nom complet
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Jean Dupont"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all"
                                />
                                <ValidationError prefix="Name" field="name" errors={state.errors} className="text-red-500 text-sm" />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                    Adresse email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="jean.dupont@exemple.com"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all"
                                />
                                <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-500 text-sm" />
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                                    Votre message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    placeholder="Bonjour, je souhaiterais en savoir plus sur..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all resize-none"
                                />
                                <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-500 text-sm" />
                            </div>

                            {/* Bouton envoi */}
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={state.submitting}
                                    className="w-full"
                                    variant="primary"
                                    icon={state.submitting ? null : Send}
                                >
                                    {state.submitting ? 'Envoi en cours...' : 'Envoyer le message'}
                                </Button>
                            </div>

                            {/* Note de bas de page */}
                            <p className="text-center text-xs text-slate-400 mt-6">
                                En envoyant ce formulaire, vous acceptez que vos données soient traitées pour répondre à votre demande.
                            </p>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default ContactPage
