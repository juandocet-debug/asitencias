const BACKEND_ORIGIN = 'https://agon-backend-production-c5d2.up.railway.app';
const REQUEST_HEADERS = [
    'accept',
    'accept-language',
    'authorization',
    'content-type',
    'cookie',
    'user-agent',
];
const RESPONSE_HEADERS = [
    'cache-control',
    'content-disposition',
    'content-language',
    'content-type',
    'etag',
    'last-modified',
    'vary',
];

export default async function handler(request, response) {
    try {
        const path = normalizePath(request.query.path);
        const query = new URLSearchParams();

    for (const [key, value] of Object.entries(request.query)) {
        if (key === 'path') continue;
        for (const item of Array.isArray(value) ? value : [value]) {
            if (item !== undefined) query.append(key, item);
        }
    }

        const target = `${BACKEND_ORIGIN}/api/${path}${path ? '/' : ''}${query.size ? `?${query}` : ''}`;
        const headers = new Headers();
        for (const name of REQUEST_HEADERS) {
            const value = request.headers[name];
            if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        }

        const method = request.method || 'GET';
        const body = method === 'GET' || method === 'HEAD'
            ? undefined
            : requestBody(request);
        const upstream = await fetch(target, {
            method,
            headers,
            body,
            duplex: 'half',
            redirect: 'manual',
        });

        for (const name of RESPONSE_HEADERS) {
            const value = upstream.headers.get(name);
            if (value) response.setHeader(name, value);
        }
        const cookies = upstream.headers.getSetCookie?.() || [];
        if (cookies.length) response.setHeader('set-cookie', cookies);

        response.status(upstream.status);
        response.send(Buffer.from(await upstream.arrayBuffer()));
    } catch {
        response.status(502).json({ error: 'El servicio no está disponible temporalmente.' });
    }
}

function requestBody(request) {
    if (request.body === undefined || request.body === null) return request;
    if (Buffer.isBuffer(request.body) || typeof request.body === 'string') return request.body;
    return JSON.stringify(request.body);
}

function normalizePath(value) {
    const parts = Array.isArray(value) ? value : [value];
    return parts
        .flatMap(part => String(part).split('/'))
        .filter(Boolean)
        .map(part => encodeURIComponent(String(part)))
        .join('/');
}
