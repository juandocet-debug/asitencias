import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    timeout: 90000, // 90 segundos — Render free tier puede tardar 50s+ en cold start
});

// ── Request interceptor: adjuntar token JWT ──────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: manejar errores de autenticación ───────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;

        // Solo cerrar sesión si el error 401 viene de un endpoint específico de auth.
        // NO borrar tokens si el servidor simplemente no respondió (cold start / red).
        if (status === 401) {
            const url = error?.config?.url || '';

            // Si el error viene del endpoint de token → credenciales inválidas → limpiar
            // Si viene de cualquier otro endpoint → puede ser token expirado → intentar refresh
            const isAuthEndpoint = url.includes('/token/') && !url.includes('/token/refresh/');

            if (isAuthEndpoint) {
                // Error de login: credenciales incorrectas
                return Promise.reject(error);
            }

            // Intentar refrescar el token antes de cerrar sesión
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `${api.defaults.baseURL}/token/refresh/`,
                        { refresh: refreshToken },
                        { timeout: 10000 }
                    );
                    const newAccessToken = response.data.access;
                    localStorage.setItem('access_token', newAccessToken);

                    // Reintentar la solicitud original con el nuevo token
                    error.config.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api.request(error.config);
                } catch (refreshError) {
                    // El refresh también falló → limpiar sesión
                    console.warn('[api.js] Refresh token inválido. Cerrando sesión.');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } else {
                // No hay refresh token → limpiar y redirigir
                localStorage.removeItem('access_token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
