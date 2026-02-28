import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getToken, getUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getUser());
    const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
    const [loading, setLoading] = useState(false);

    // Sync auth state when token changes
    useEffect(() => {
        const token = getToken();
        const stored = getUser();
        setIsAuthenticated(!!token);
        setUser(stored);
    }, []);

    const login = async (credentials) => {
        setLoading(true);
        try {
            const data = await authAPI.login(credentials);
            setUser(data.user);
            setIsAuthenticated(true);
            return data;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (credentials) => {
        setLoading(true);
        try {
            const data = await authAPI.signup(credentials);
            return data;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authAPI.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
