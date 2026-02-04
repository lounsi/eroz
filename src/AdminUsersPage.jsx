import { useState, useEffect } from 'react';
import { Users, ArrowLeft, Shield, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import client from './api/client';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await client.get('/users');
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await client.put(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Failed to update role', error);
            alert('Failed to update role');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-medical-600 mb-8 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Retour à l'accueil
            </Link>

            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Users className="w-8 h-8 text-medical-600" />
                            Gestion des utilisateurs
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Administrez les comptes et les niveaux d'accès.
                        </p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
                        Total utilisateurs: {users.length}
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Utilisateur</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Rôle Actuel</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{user.name}</div>
                                            <div className="text-xs text-slate-500">Inscrit le {new Date(user.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    user.role === 'PROF' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        'bg-green-100 text-green-700 border-green-200'}`}>
                                                {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 text-sm py-1"
                                            >
                                                <option value="STUDENT">STUDENT</option>
                                                <option value="PROF">PROF</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
