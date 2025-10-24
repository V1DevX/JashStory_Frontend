import { createContext, useContext, useEffect, useState } from 'react';
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

    // При монтировании — сначала пытаемся обновить accessToken через cookie-refresh,
    // затем получаем current-user. Это позволяет новым вкладкам автоматически логиниться,
    // если refresh-cookie (HttpOnly) присутствует.
    useEffect(() => {
        (async () => {
            try {
                // 1) Попытка обновить accessToken по refresh-cookie
                //    сервер должен отвечать Set-Cookie и выдавать accessToken в теле
                try {
                    const r = await api.post('/auth/refresh'); // withCredentials уже включён в api.js
                    if (r?.data?.accessToken) {
                        sessionStorage.setItem('accessToken', r.data.accessToken);
                    }
                } catch (e) {
                    // refresh мог вернуть 401 — это нормально, продолжим и оставим user=null
                    console.debug('Refresh failed or not present (ok):', e?.response?.data || e?.message);
                }

                // 2) После попытки refresh — пробуем получить current-user (если accessToken теперь есть)
                try {
                    const { data } = await api.get('/auth/current-user');
                    setUser(data.data);
                } catch (e) {
                    setUser(null);
                }
            } catch (e) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        // сервер отдаёт accessToken в теле; сохраняем и загружаем профиль
        if (data?.accessToken) sessionStorage.setItem('accessToken', data.accessToken);
        
        const userRes = await api.get('/auth/current-user');
        setUser(userRes.data.data);
    };

    const logout = async () => {
        await api.post('/auth/logout'); // сервер должен очистить refresh-cookie
        sessionStorage.removeItem('accessToken');
        setUser(null);
        // по желанию редирект
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
    if (loading) return null; // спиннер по вкусу
    if (!user) return <Navigate to='/login' replace={true}/>
    
    return <Outlet />
}