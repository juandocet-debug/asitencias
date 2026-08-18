import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { clearClientSession, logoutSession, refreshAccessToken } from '../services/api';

const UserContext = createContext();
const MAX_ATTEMPTS = 3;
const BASE_DELAY = 1200;
const STUDENT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser debe ser usado dentro de un UserProvider');
    return context;
};

const wait = delay => new Promise(resolve => setTimeout(resolve, delay));

const fetchUserWithRetry = async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const response = await api.get('/users/me/', { timeout: 20000 });
            return response.data;
        } catch (error) {
            const status = error?.response?.status;
            if (status === 401 || status === 403 || attempt === MAX_ATTEMPTS) throw error;
            await wait(BASE_DELAY * attempt);
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

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeRole, setActiveRoleState] = useState(null);

    const setActiveRole = (role) => {
        if (!user) return;
        localStorage.setItem(`active_role_${user.id}`, role);
        setActiveRoleState(role);
    };

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const userData = await fetchUserWithRetry();
            setUser(userData);
            setActiveRoleState(getSavedActiveRole(userData));
            return userData;
        } catch (error) {
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

    useEffect(() => {
        const effectiveRole = activeRole || user?.role;
        if (!user || effectiveRole !== 'STUDENT') return undefined;

        let timeoutId;
        let closing = false;
        const closeIdleSession = async () => {
            if (closing) return;
            closing = true;
            clearClientSession();
            setUser(null);
            await logoutSession();
            window.location.replace('/login');
        };
        const resetIdleTimer = () => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(closeIdleSession, STUDENT_IDLE_TIMEOUT_MS);
        };

        ACTIVITY_EVENTS.forEach(name => window.addEventListener(name, resetIdleTimer, { passive: true }));
        resetIdleTimer();
        return () => {
            window.clearTimeout(timeoutId);
            ACTIVITY_EVENTS.forEach(name => window.removeEventListener(name, resetIdleTimer));
        };
    }, [activeRole, user?.id, user?.role]);

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, fetchUser, loading, activeRole, setActiveRole }}>
            {children}
        </UserContext.Provider>
    );
};
