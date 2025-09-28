import axios from "axios";
import { API_URL } from "./config";

const api = axios.create({
	baseURL: API_URL,
	withCredentials: true,
});

let isRefreshing = false;
let queue = [];

// JWT
api.interceptors.request.use((config) => {
	const token = sessionStorage.getItem('accessToken')
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

api.interceptors.response.use(
	res => res,
	async (error) => {
		const original = error.config;

		console.log('Error message: '+error.response.data?.message );
		switch (error.response.data?.message) {
			case "Expired token":
				if (isRefreshing) {
					await new Promise((resolve) => queue.push(resolve));
				} else {
					isRefreshing = true;
					original._retry = true;
					try {
						const { data } = await api.post('/auth/refresh'); // cookie -> new access
						sessionStorage.setItem('accessToken', data.accessToken);

						queue.forEach((fn) => fn());
						queue = [];

					} catch (e) {
						sessionStorage.removeItem('accessToken');
						// window.location.href = '/login';
						throw e;

					} finally {
						isRefreshing = false;
					}
				}
				// повтор исходного запроса
				original.headers.Authorization = `Bearer ${sessionStorage.getItem('accessToken')}`;
				return api(original);

			default:
				throw error.response?.data ;
		}
	}
);

export default api;