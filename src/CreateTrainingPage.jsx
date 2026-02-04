import { PlusCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CreateTrainingPage = () => {
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
                            <PlusCircle className="w-8 h-8 text-medical-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Création d'entraînement</h1>
                    </div>
                    <p className="text-slate-600 text-lg">
                        Espace réservé aux professeurs pour créer de nouveaux modules d'exercices.
                    </p>
                </header>

                <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <PlusCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Créer un nouveau module</h3>
                    <p className="text-slate-500 max-w-md mb-6">
                        Configurez les paramètres de l'entraînement, importez des images médicales et définissez les zones d'intérêt.
                    </p>
                    <button className="px-6 py-3 bg-medical-600 text-white rounded-lg font-medium hover:bg-medical-700 transition-colors">
                        Commencer la création
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTrainingPage;
