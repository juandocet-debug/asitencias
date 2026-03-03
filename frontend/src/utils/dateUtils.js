// utils/dateUtils.js
// Funciones de formato de fecha para el sistema (locale es-CO)

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

// Construye la URL completa para archivos de media.
// Si el path ya es una URL completa (Cloudinary), la devuelve tal cual.
export const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};
