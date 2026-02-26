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

/**
 * Devuelve el rol activo guardado en localStorage para un usuario dado.
 * Si no hay ninguno guardado, devuelve el rol principal del usuario.
 */
const getSavedActiveRole = (userData) => {
    if (!userData) return null;
    const saved = localStorage.getItem(`active_role_${userData.id}`);
    const allRoles = userData.roles?.length > 0 ? userData.roles : [userData.role];
    // Validar que el rol guardado siga siendo válido para este usuario
    if (saved && allRoles.includes(saved)) return saved;
    return userData.role || allRoles[0];
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // activeRole: el rol "activo" que el usuario eligió mostrar en la sesión actual
    const [activeRole, setActiveRoleState] = useState(null);

    /** Cambia el rol activo y lo persiste en localStorage */
    const setActiveRole = (role) => {
        if (!user) return;
        localStorage.setItem(`active_role_${user.id}`, role);
        setActiveRoleState(role);
    };

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const userData = await fetchUserWithRetry(3, 1500);
            setUser(userData);
            // Restaurar el rol activo guardado (o usar el rol principal)
            setActiveRoleState(getSavedActiveRole(userData));
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
        <UserContext.Provider value={{ user, setUser, updateUser, fetchUser, loading, activeRole, setActiveRole }}>
            {children}
        </UserContext.Provider>
    );
};
