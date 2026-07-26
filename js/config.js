// Central configuration for backend connection
// Connects to Render backend via Vercel environment variable (VITE_BACKEND_URL) or direct URL
const getBackendUrl = () => {
    if (localStorage.getItem('tictactoe_backend_url')) {
        return localStorage.getItem('tictactoe_backend_url');
    }
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) {
            return import.meta.env.VITE_BACKEND_URL;
        }
    } catch (e) {}

    const host = window.location.hostname;
    // Match localhost, 127.0.0.1, or local IP addresses (e.g. 192.168.x.x)
    if (host === 'localhost' || host === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
        const port = window.location.port === '5000' ? '5000' : '5000';
        return `http://${host}:${port}`;
    }

    return ''; // Render / Vercel URL
};

const CONFIG = {
    BACKEND_URL: getBackendUrl()
};


