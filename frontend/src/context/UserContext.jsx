import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { clearClientSession, refreshAccessToken } from '../services/api';

const UserContext = createContext();
const MAX_ATTEMPTS = 8;
const BASE_DELAY = 3000;

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser debe ser usado dentro de un UserProvider');
    return context;
};

const wait = delay => new Promise(resolve => setTimeout(resolve, delay));

const fetchUserWithRetry = async (onReconnect) => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await api.get('/users/me/', { timeout: 20000 });
            return response.data;
        } catch (error) {
            const status = error?.response?.status;
            if (status === 401 || status === 403 || attempt === MAX_ATTEMPTS) throw error;
            if (attempt >= 2 && onReconnect) onReconnect();
            await wait(BASE_DELAY * Math.min(attempt, 3));
        }
    }
    return null;
};

const getSavedActiveRole = (userData) => {
    if (!userData) return null;
    const saved = localStorage.getItem(`active_role_${userData.id}`);
    const allRoles = userData.roles?.length > 0 ? userData.roles : [userData.role];
    if (saved && allRoles.includes(saved)) return saved;
    return userData.role || allRoles[0];
};

export const WakingScreen = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-upn-900 via-upn-800 to-slate-900">
        <div className="max-w-sm px-6 text-center">
            <div className="relative mx-auto mb-6 h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-upn-700" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-upn-400" />
                <div className="absolute inset-2 flex items-center justify-center rounded-full bg-upn-800">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-upn-300">
                        <path
                            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>

            <h2 className="mb-2 text-xl font-black text-white">Reconectando con el servicio</h2>
            <p className="text-sm leading-relaxed text-upn-300">
                Estamos verificando la conexión.<br />
                Intenta de nuevo en unos segundos…
            </p>

            <div className="mt-6 h-1 overflow-hidden rounded-full bg-upn-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-upn-500 to-upn-300"
                    style={{ width: '60%', animation: 'wakeProgress 3s ease-in-out infinite' }}
                />
            </div>

            <p className="mt-4 text-xs font-medium text-upn-500">AGON · UPN</p>
        </div>

        <style>{`
            @keyframes wakeProgress {
                0% { width: 10%; opacity: 0.6; }
                50% { width: 80%; opacity: 1; }
                100% { width: 10%; opacity: 0.6; }
            }
        `}</style>
    </div>
);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWaking, setIsWaking] = useState(false);
    const [activeRole, setActiveRoleState] = useState(null);

    const setActiveRole = (role) => {
        if (!user) return;
        localStorage.setItem(`active_role_${user.id}`, role);
        setActiveRoleState(role);
    };

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const userData = await fetchUserWithRetry(() => setIsWaking(true));
            setIsWaking(false);
            setUser(userData);
            setActiveRoleState(getSavedActiveRole(userData));
            return userData;
        } catch (error) {
            setIsWaking(false);
            if ([401, 403].includes(error?.response?.status)) clearClientSession();
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = updatedData => setUser(prev => ({ ...prev, ...updatedData }));

    useEffect(() => {
        refreshAccessToken()
            .then(fetchUser)
            .catch(() => {
                clearClientSession();
                setUser(null);
                setLoading(false);
            });
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, fetchUser, loading, activeRole, setActiveRole }}>
            {isWaking && <WakingScreen />}
            {children}
        </UserContext.Provider>
    );
};
