import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
let accessToken = null;
let refreshPromise = null;

const api = axios.create({
    baseURL,
    timeout: 90000,
    withCredentials: true,
});

export const setAccessToken = (token) => {
    accessToken = token || null;
};

export const hasAccessToken = () => Boolean(accessToken);

export const refreshAccessToken = async () => {
    if (!refreshPromise) {
        refreshPromise = axios.post(
            `${baseURL}/token/refresh/`,
            {},
            { timeout: 15000, withCredentials: true },
        ).then((response) => {
            setAccessToken(response.data.access);
            return response.data.access;
        }).finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

export const logoutSession = async () => {
    setAccessToken(null);
    try {
        await axios.post(`${baseURL}/token/logout/`, {}, { withCredentials: true });
    } catch {
        // La sesión local queda cerrada incluso si la red no responde.
    }
};

api.interceptors.request.use((config) => {
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error?.config;
        const url = request?.url || '';
        const isTokenEndpoint = url.includes('/token/');

        if (error?.response?.status === 401 && request && !request._retry && !isTokenEndpoint) {
            request._retry = true;
            try {
                const token = await refreshAccessToken();
                request.headers.Authorization = `Bearer ${token}`;
                return api.request(request);
            } catch {
                setAccessToken(null);
                if (window.location.pathname !== '/login') window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    },
);

export default api;
