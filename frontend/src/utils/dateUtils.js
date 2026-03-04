// utils/dateUtils.js
// Funciones de formato de fecha para el sistema (locale es-CO)
//
// ⚠️ IMPORTANTE: NO usar new Date('YYYY-MM-DD') directamente.
//    En JavaScript, los date-only strings se interpretan como UTC medianoche.
//    En Colombia (UTC-5) eso es el DÍA ANTERIOR a las 19:00 → off-by-1 day.
//    Solución: parsear manualmente y crear con new Date(y, m-1, d) = LOCAL midnight.

// Parsea un date string 'YYYY-MM-DD' como fecha LOCAL (sin desfase de zona horaria)
const parseLocal = (dateStr) => {
    if (!dateStr) return null;
    const s = String(dateStr).substring(0, 10);  // tomar solo los primeros 10 chars
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0);  // mediodía local → immune a DST
};

export const formatDate = (dateStr) => {
    const date = parseLocal(dateStr);
    if (!date) return '';
    return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
    const date = parseLocal(dateStr);
    if (!date) return '';
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
