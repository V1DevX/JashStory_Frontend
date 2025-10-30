import axios from "axios";
import { API_URL } from "./config";

const api = axios.create({
	baseURL: API_URL,
	withCredentials: true,
});

let isRefreshing = false;
let queue = [];

// attach access token from sessionStorage (tab-scoped)
api.interceptors.request.use((config) => {
	const token = sessionStorage.getItem('accessToken')
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

api.interceptors.response.use(
	res => res,
	async (error) => {
		const original = error.config;
		const status = error.response?.status;
		const message = error.response?.data?.message;

		// don't try to refresh for auth endpoints themselves
		const skipRefresh = original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/login') || original?._retry;

		// If 401 and message indicates missing/expired access token -> try refresh
		if (status === 401 && !skipRefresh && (message === 'Expired token' || message === 'No token')) {
			if (isRefreshing) {
				// wait for the current refresh to finish
				await new Promise((resolve) => queue.push(resolve));
			} else {
				isRefreshing = true;
				original._retry = true;
				try {
					// Call refresh to get a new access token (cookie included via withCredentials)
					const { data } = await api.post('/auth/refresh');
					if (data?.accessToken) {
						sessionStorage.setItem('accessToken', data.accessToken);
					}
					// wake up queued requests
					queue.forEach(fn => fn());
					queue = [];
				} catch (e) {
					// refresh failed -> clear token and propagate
					sessionStorage.removeItem('accessToken');
					queue = [];
					throw e;
				} finally {
					isRefreshing = false;
				}
			}

			// retry original request with new token (if available)
			original.headers = original.headers || {};
			const newToken = sessionStorage.getItem('accessToken');
			if (newToken) original.headers.Authorization = `Bearer ${newToken}`;
			return api(original);
		}

		// other errors -> propagate server error body
		throw error.response?.data || error;
	}
);

export default api;