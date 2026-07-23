// Central configuration for backend connection
// Replace BACKEND_URL below with your live Render URL once deployed (e.g. https://your-backend.onrender.com)
const CONFIG = {
    BACKEND_URL: localStorage.getItem('tictactoe_backend_url') ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000'
            : '')
};
