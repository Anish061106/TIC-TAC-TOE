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
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    
    return ''; // Set your Render URL here if not using Vercel Env variables (e.g. 'https://your-backend.onrender.com')
};

const CONFIG = {
    BACKEND_URL: getBackendUrl()
};

