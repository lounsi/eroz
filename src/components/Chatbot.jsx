import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Button from './ui/Button';

const Chatbot = () => {
    const { isChatVisible, isChatOpen, toggleChat, setIsChatOpen } = useChat();
    const { user } = useAuth();
    const location = useLocation();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Bonjour ! Je suis l\'Assistant Éroz. Comment puis-je t\'aider dans tes révisions aujourd\'hui ?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatOpen]);

    // Visibilité basée sur la route (en plus du contexte)
    // Masquer sur Accueil, Admin, Login, Register
    const isHiddenRoute =
        location.pathname === '/' ||
        location.pathname.startsWith('/admin') ||
        location.pathname === '/login' ||
        location.pathname === '/register';

    // Si l'utilisateur n'est pas connecté, on ne montre pas le chat (sauf si on veut un bot public, mais la consigne demande accès aux données étudiant)
    if (!user || isHiddenRoute || !isChatVisible) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Préparer l'historique pour l'API (exclure le message de bienvenue s'il n'est pas formaté comme l'API l'attend, ou juste envoyer les derniers)
            const conversationHistory = messages.concat(userMessage).map(m => ({
                role: m.role,
                content: m.content
            }));

            const { data } = await client.post('/chat', { messages: conversationHistory });

            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, je rencontre un problème de connexion. Réessaie plus tard." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Fenêtre de Chat */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mb-4 pointer-events-auto flex flex-col max-h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-medical-600 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Assistant Éroz</h3>
                                    <p className="text-xs text-medical-100 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                        En ligne
                                    </p>
                                </div>
                            </div>
                            <button onClick={toggleChat} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[300px]">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                        ? 'bg-medical-600 rounded-tr-none shadow-md'
                                        : 'bg-white border border-slate-200 rounded-tl-none shadow-sm'
                                        }`}>
                                        <p className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-white font-medium' : 'text-slate-900'}`}>
                                            {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                                                part.startsWith('**') && part.endsWith('**') ?
                                                    <strong key={i}>{part.slice(2, -2)}</strong> :
                                                    part
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-medical-600" />
                                        <span className="text-xs text-slate-400">Analyse en cours...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pose ta question..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-2 bg-medical-600 text-white rounded-xl hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bouton Flottant (Toggle) */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleChat}
                className="bg-medical-600 text-white p-4 rounded-full shadow-xl hover:bg-medical-700 transition-colors pointer-events-auto relative group"
            >
                {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}

                {/* Tooltip */}
                {!isChatOpen && (
                    <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Besoin d'aide ?
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default Chatbot;
