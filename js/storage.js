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
