import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { apiRequest } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            setLoading(false);
            return;
        }

        apiRequest('/me')
            .then((response) => {
                setUser(response.user);
            })
            .catch(() => {
                localStorage.removeItem('auth_token');
                setUser(null);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    async function login(email, password) {
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
            }),
        });

        localStorage.setItem('auth_token', response.token);
        setUser(response.user);

        return response;
    }

    async function register(name, email, password, passwordConfirmation) {
        const response = await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            }),
        });

        localStorage.setItem('auth_token', response.token);
        setUser(response.user);

        return response;
    }

    async function logout() {
        try {
            await apiRequest('/logout', {
                method: 'POST',
            });
        } finally {
            localStorage.removeItem('auth_token');
            setUser(null);
        }
    }

    const value = useMemo(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(user),
            login,
            register,
            logout,
        }),
        [user, loading],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider.');
    }

    return context;
}