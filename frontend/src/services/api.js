import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const usesProxyFunction = baseURL === '/api/proxy';
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
export const getAccessToken = () => accessToken;

export const clearClientSession = () => {
    setAccessToken(null);
    localStorage.removeItem('username');
    Object.keys(localStorage)
        .filter(key => key.startsWith('active_role_'))
        .forEach(key => localStorage.removeItem(key));
};

export const refreshAccessToken = async () => {
    if (!refreshPromise) {
        refreshPromise = axios.post(
            endpointUrl('/token/refresh/'),
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
    clearClientSession();
    try {
        await axios.post(endpointUrl('/token/logout/'), {}, { timeout: 8000, withCredentials: true });
    } catch {
        // La sesión local queda cerrada aunque la red no responda.
    }
};

api.interceptors.request.use((config) => {
    if (usesProxyFunction) {
        const [pathname, rawQuery = ''] = String(config.url || '').split('?');
        const params = new URLSearchParams(rawQuery);
        params.set('path', pathname.replace(/^\/+|\/+$/g, ''));
        Object.entries(config.params || {}).forEach(([key, value]) => {
            for (const item of Array.isArray(value) ? value : [value]) {
                if (item !== undefined && item !== null) params.append(key, item);
            }
        });
        config.url = '';
        config.params = params;
    }
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

function endpointUrl(path) {
    if (!usesProxyFunction) return `${baseURL}${path}`;
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    return `${baseURL}?path=${encodeURIComponent(cleanPath)}`;
}

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
                clearClientSession();
                if (window.location.pathname !== '/login') window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    },
);

export default api;
