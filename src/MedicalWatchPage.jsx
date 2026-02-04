import { Newspaper, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MedicalWatchPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-medical-600 mb-8 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Retour à l'accueil
            </Link>

            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-medical-100 rounded-xl">
                            <Newspaper className="w-8 h-8 text-medical-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Veille Médicale</h1>
                    </div>
                    <p className="text-slate-600 text-lg">
                        Dernières actualités et publications sur l'imagerie médicale et l'IA.
                    </p>
                </header>

                <div className="grid gap-6">
                    {/* Placeholder content */}
                    {[1, 2, 3].map((item) => (
                        <article key={item} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-accent-50 text-accent-600 rounded-full text-xs font-medium">
                                    IA & Diagnostic
                                </span>
                                <span className="text-slate-400 text-sm">Il y a 2 jours</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">
                                Nouvelle avancée dans la détection précoce des tumeurs
                            </h2>
                            <p className="text-slate-600 mb-4">
                                Une étude récente démontre l'efficacité des nouveaux algorithmes de vision par ordinateur pour identifier les micro-anomalies...
                            </p>
                            <button className="text-medical-600 font-medium hover:text-medical-700 text-sm">
                                Lire la suite →
                            </button>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MedicalWatchPage;
