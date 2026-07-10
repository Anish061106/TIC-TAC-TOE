// ========================================
// STORAGE UTILITIES
// ========================================

/**
 * Load game state from localStorage
 */
function loadState(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Save game state to localStorage
 */
function saveState(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Load all saved game data
 */
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

/**
 * Apply theme
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    saveState('tictactoe_theme', theme);
}

/**
 * Get theme
 */
function getTheme() {
    return loadState('tictactoe_theme') || 'classic';
}

/**
 * Set sound enabled
 */
function setSoundEnabled(enabled) {
    saveState('tictactoe_sound', enabled);
}

/**
 * Get sound enabled
 */
function isSoundEnabled() {
    return loadState('tictactoe_sound') !== false;
}
