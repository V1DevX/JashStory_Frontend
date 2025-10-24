import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate, Outlet } from 'react-router-dom'
import api from '@/api'


const AuthCtx = createContext({ 
    user:null, 
    loading:true, 
    login: async()=>{}, 
    logout: async()=>{} 
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // helper: try refresh (uses cookie) and then load current-user
    const refreshAndLoadUser = useCallback(async () => {
        try {
            // попытка получить новый accessToken по refresh-cookie
            try {
                const r = await api.post('/auth/refresh');
                if (r?.data?.accessToken) sessionStorage.setItem('accessToken', r.data.accessToken);
            } catch (e) {
                // refresh может вернуть 401 — это нормально
                console.debug('refresh failed:', e?.response?.data || e?.message);
            }

            // после refresh пробуем получить профиль
            try {
                const { data } = await api.get('/auth/current-user');
                setUser(data.data);
                return true;
            } catch (e) {
                setUser(null);
                return false;
            }
        } catch (e) {
            setUser(null);
            return false;
        }
    }, []);

    // on mount: try refresh -> load user, и подпишемся на события storage (cross-tab)
    useEffect(() => {
        (async () => {
            await refreshAndLoadUser();
            setLoading(false);
        })();

        const onStorage = (e) => {
            if (!e.key) return;
            // Когда в другой вкладке произошло логин-событие — попытаться refresh+load
            if (e.key === 'auth-event' && e.newValue) {
                // короткая debounce, чтобы избежать гонки
                setTimeout(() => refreshAndLoadUser(), 50);
            }
            // Когда произошёл logout в другой вкладке — очистить локально
            if (e.key === 'auth-logout' && e.newValue) {
                sessionStorage.removeItem('accessToken');
                setUser(null);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [refreshAndLoadUser]);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data?.accessToken) sessionStorage.setItem('accessToken', data.accessToken);

        const userRes = await api.get('/auth/current-user');
        setUser(userRes.data.data);

        // оповестить другие вкладки, что вошли (вставляем timestamp, чтобы событие сработало)
        try { localStorage.setItem('auth-event', Date.now().toString()); } catch {}
    };

    const logout = async () => {
        await api.post('/auth/logout'); // сервер очищает refresh-cookie
        sessionStorage.removeItem('accessToken');
        setUser(null);

        // оповестить другие вкладки о логауте
        try { localStorage.setItem('auth-logout', Date.now().toString()); } catch {}
    };

    return (
        <AuthCtx.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}

export const useAuth = () => useContext(AuthCtx);

export const RequireAuth = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to='/login' replace={true}/>
    return <Outlet />
}