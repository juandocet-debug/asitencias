/* eslint-disable */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser debe ser usado dentro de un UserProvider');
    }
    return context;
};

/**
 * Intenta llamar a /users/me/ con reintentos automáticos.
 * Esto es crítico cuando el servidor (Render) está en "cold start"
 * y tarda unos segundos en responder correctamente.
 */
const fetchUserWithRetry = async (retries = 3, delay = 1500) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await api.get('/users/me/');
            return response.data;
        } catch (error) {
            const status = error?.response?.status;

            // Si el error es 401 (sin token) o 403 (prohibido), no reintentar — es definitivo
            if (status === 401 || status === 403) {
                throw error;
            }

            // Si es el último intento, lanzar el error
            if (attempt === retries) {
                throw error;
            }

            // Esperar antes del siguiente intento (servidor calentando)
            console.warn(`[UserContext] Intento ${attempt} fallido (status: ${status || 'red'}). Reintentando en ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const userData = await fetchUserWithRetry(3, 1500);
            setUser(userData);
        } catch (error) {
            const status = error?.response?.status;
            console.error('[UserContext] Error al cargar usuario después de reintentos:', error);

            // Solo borrar tokens si el servidor dice explícitamente que no es válido (401)
            // No borrar si es un error de red / servidor caído (para no cerrar sesión por cold start)
            if (status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = (updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
    };

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, fetchUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};
