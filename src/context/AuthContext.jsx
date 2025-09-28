import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom'
import api from '../api'


const AuthCtx = createContext({ 
	user:null, 
	loading:true, 
	login: async()=>{}, 
	logout: async()=>{} 
});



export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	// При монтировании — пробуем получить /me (если есть валидный access или удастся refresh)
	useEffect(() => {(async () => {
			try {
				const { data } = await api.get('/auth/current-user');
				setUser(data.data);
			} catch (data) {
				setUser(null);
				
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const login = async (email, password) => {
		const { data } = await api.post('/auth/login', { email, password });
		sessionStorage.setItem('accessToken', data.accessToken);
		
		const user = await api.get('/auth/current-user');
		setUser(user.data.data);
	};

	const logout = async () => {
		await api.post('/auth/logout');
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