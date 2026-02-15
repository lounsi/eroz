import { useState, useEffect } from 'react';
import { Users, Shield, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlobalNavigation from '@/components/GlobalNavigation';
import client from './api/client';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers();
    }, [debouncedSearch]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : '';
            const { data } = await client.get(`/users${params}`);
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

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera toutes ses données.')) {
            try {
                await client.delete(`/users/${userId}`);
                setUsers(users.filter(u => u.id !== userId));
            } catch (error) {
                console.error('Failed to delete user', error);
                alert('Erreur lors de la suppression de l\'utilisateur');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24">
            <div>
                <GlobalNavigation />
            </div>

            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Users className="w-8 h-8 text-medical-600" />
                            Gestion des utilisateurs
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Administrez les comptes et les niveaux d'accès.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, prénom ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent w-64 md:w-80 text-sm"
                            />
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
                            Total: {users.length}
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Nom</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Prénom</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Rôle</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            Chargement...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            Aucun utilisateur trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{user.lastName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-700">{user.firstName}</div>
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
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        className="block w-32 rounded-md border-slate-300 shadow-sm focus:border-medical-500 focus:ring-medical-500 text-sm py-1"
                                                    >
                                                        <option value="STUDENT">STUDENT</option>
                                                        <option value="PROF">PROF</option>
                                                        <option value="ADMIN">ADMIN</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Supprimer l'utilisateur"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
