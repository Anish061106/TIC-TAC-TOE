// ========================================
// MAIN UTILITIES
// ========================================

/**
 * Switch screen
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

/**
 * Generate room code
 */
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Setup navigation active state
 */
function setupNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && currentPage === '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Initialize theme on page load
 */
function initializeTheme() {
    const theme = getTheme();
    applyTheme(theme);

    const themeBtn = document.querySelector(`[data-theme="${theme}"]`);
    if (themeBtn && themeBtn.classList.contains('theme-btn')) {
        themeBtn.classList.add('active');
    }
}

/**
 * Initialize sound toggle
 */
function initializeSoundToggle() {
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        updateSoundToggleUI();
        soundToggle.addEventListener('click', () => {
            const newState = !isSoundEnabled();
            setSoundEnabled(newState);
            updateSoundToggleUI();
            if (newState) SoundEngine.playClick();
        });
    }
}

/**
 * Update sound toggle UI
 */
function updateSoundToggleUI() {
    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.textContent = isSoundEnabled() ? '🔊' : '🔇';
    }
}

/**
 * Setup theme buttons
 */
function setupThemeButtons() {
    document.querySelectorAll('[data-theme]').forEach(btn => {
        if (btn.classList.contains('theme-btn')) {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                applyTheme(e.target.dataset.theme);
            });
        }
    });
}

/**
 * Global initialization
 */
function initializeApp() {
    setupNavigation();
    initializeTheme();
    initializeSoundToggle();
    setupThemeButtons();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
