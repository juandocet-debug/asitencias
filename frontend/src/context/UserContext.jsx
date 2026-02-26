/* eslint-disable */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const UserContext = createContext();

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser debe ser usado dentro de un UserProvider');
    return context;
};

/**
 * Intenta /users/me/ con backoff exponencial.
 * Render (plan gratuito) duerme tras 15 min y puede tardar hasta 60s en despertar.
 * Reintentamos durante ~90s en total antes de rendirse.
 */
const fetchUserWithRetry = async (onWaking) => {
    const MAX_ATTEMPTS = 8;
    const BASE_DELAY = 3000; // 3s entre intentos → hasta ~24s de espera pura

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await api.get('/users/me/', { timeout: 20000 });
            return response.data;
        } catch (error) {
            const status = error?.response?.status;

            // Error definitivo — no reintentar
            if (status === 401 || status === 403) throw error;

            // Último intento — rendirse
            if (attempt === MAX_ATTEMPTS) throw error;

            // A partir del 2° intento mostrar indicador de "calentando"
            if (attempt >= 2 && onWaking) onWaking(attempt);

            const delay = BASE_DELAY * Math.min(attempt, 3); // 3s → 6s → 9s → 9s...
            console.warn(`[UserContext] Intento ${attempt} fallido. Reintentando en ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

const getSavedActiveRole = (userData) => {
    if (!userData) return null;
    const saved = localStorage.getItem(`active_role_${userData.id}`);
    const allRoles = userData.roles?.length > 0 ? userData.roles : [userData.role];
    if (saved && allRoles.includes(saved)) return saved;
    return userData.role || allRoles[0];
};

/* ── Pantalla de calentamiento de servidor ─────────────────────────────── */
export const WakingScreen = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-upn-900 via-upn-800 to-slate-900 flex flex-col items-center justify-center z-50">
        <div className="text-center max-w-sm px-6">
            {/* Spinner animado */}
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-upn-700" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-upn-400 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-upn-800 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-upn-300">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            <h2 className="text-xl font-black text-white mb-2">Despertando el servidor</h2>
            <p className="text-upn-300 text-sm leading-relaxed">
                El servidor está en modo ahorro de energía.<br />
                Estará listo en unos segundos…
            </p>

            {/* Barra de progreso animada */}
            <div className="mt-6 h-1 bg-upn-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-upn-500 to-upn-300 rounded-full animate-pulse"
                    style={{ width: '60%', animation: 'wakeProgress 3s ease-in-out infinite' }} />
            </div>

            <p className="text-upn-500 text-xs mt-4 font-medium">AGON · UPN</p>
        </div>

        <style>{`
            @keyframes wakeProgress {
                0%   { width: 10%; opacity: 0.6; }
                50%  { width: 80%; opacity: 1;   }
                100% { width: 10%; opacity: 0.6; }
            }
        `}</style>
    </div>
);

/* ─────────────────────────────────────────────────────────────────────── */

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWaking, setIsWaking] = useState(false); // servidor despertando
    const [activeRole, setActiveRoleState] = useState(null);

    const setActiveRole = (role) => {
        if (!user) return;
        localStorage.setItem(`active_role_${user.id}`, role);
        setActiveRoleState(role);
    };

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const userData = await fetchUserWithRetry((attempt) => {
                // Mostrar pantalla de "calentando" a partir del 2° intento fallido
                setIsWaking(true);
            });
            setIsWaking(false);
            setUser(userData);
            setActiveRoleState(getSavedActiveRole(userData));
        } catch (error) {
            setIsWaking(false);
            const status = error?.response?.status;
            console.error('[UserContext] Error al cargar usuario:', error.message);
            if (status === 401) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = (updatedData) => setUser(prev => ({ ...prev, ...updatedData }));

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) fetchUser();
        else setLoading(false);
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, fetchUser, loading, activeRole, setActiveRole }}>
            {isWaking && <WakingScreen />}
            {children}
        </UserContext.Provider>
    );
};
