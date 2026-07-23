// Helper to interact with localStorage for game state, scores, theme, and sounds.

function loadState(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function saveState(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadAllSavedData() {
    const history = loadState('tictactoe_history') || [];
    const scoreboard = loadState('tictactoe_scoreboard') || {};
    const theme = loadState('tictactoe_theme') || 'classic';
    const soundEnabled = loadState('tictactoe_sound') !== false;

    return {
        history,
        scoreboard,
        theme,
        soundEnabled
    };
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    saveState('tictactoe_theme', theme);
}

function getTheme() {
    return loadState('tictactoe_theme') || 'classic';
}

function setSoundEnabled(enabled) {
    saveState('tictactoe_sound', enabled);
}

function isSoundEnabled() {
    return loadState('tictactoe_sound') !== false;
}

// Backend Sync & Helper API Functions
async function fetchStatsFromBackend() {
    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (!backendUrl) return loadAllSavedData();

    try {
        const res = await fetch(`${backendUrl}/api/stats`, { method: 'GET' });
        if (res.ok) {
            const data = await res.json();
            if (data && data.scoreboard) {
                saveState('tictactoe_scoreboard', data.scoreboard);
                saveState('tictactoe_history', data.history || []);
                return {
                    scoreboard: data.scoreboard,
                    history: data.history || [],
                    theme: getTheme(),
                    soundEnabled: isSoundEnabled(),
                    fromBackend: true
                };
            }
        }
    } catch (err) {
        console.warn('Backend server offline or unreachable. Using localStorage.', err);
    }
    return loadAllSavedData();
}

async function saveGameResultToBackend(gameRecord, winner) {
    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (!backendUrl) return;

    try {
        await fetch(`${backendUrl}/api/game-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...gameRecord,
                winner: winner
            })
        });
    } catch (err) {
        console.warn('Failed to sync game result with backend API:', err);
    }
}

async function clearBackendStats() {
    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (backendUrl) {
        try {
            await fetch(`${backendUrl}/api/stats`, { method: 'DELETE' });
        } catch (err) {
            console.warn('Failed to clear stats on backend:', err);
        }
    }
    localStorage.removeItem('tictactoe_scoreboard');
    localStorage.removeItem('tictactoe_history');
}

