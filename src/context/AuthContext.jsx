import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                try {
                    // Refresh user data from server
                    // Note: client interceptor handles the token from localStorage
                    const { data } = await client.get('/auth/me');
                    const updatedUser = { ...data, token: parsedUser.token };
                    localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist key info
                    setUser(updatedUser);
                } catch (error) {
                    console.error("Failed to refresh user data", error);
                    if (error.response?.status === 401) {
                        localStorage.removeItem('user');
                        setUser(null);
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await client.post('/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            navigate('/');
            return { success: true };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (firstName, lastName, email, password) => {
        try {
            const { data } = await client.post('/auth/register', { firstName, lastName, email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            navigate('/medical-watch');
            return { success: true };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const updateUser = (userData) => {
        const newUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
