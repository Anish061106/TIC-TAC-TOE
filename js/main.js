// Global utilities and initialization functions

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function setupNavigation() {
    let currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!currentPage.endsWith('.html')) {
        currentPage = currentPage ? `${currentPage}.html` : 'index.html';
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && (currentPage === '' || currentPage === 'index.html'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function initializeTheme() {
    const theme = getTheme();
    applyTheme(theme);

    const themeBtn = document.querySelector(`[data-theme="${theme}"]`);
    if (themeBtn && themeBtn.classList.contains('theme-btn')) {
        themeBtn.classList.add('active');
    }
}

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

function updateSoundToggleUI() {
    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.textContent = isSoundEnabled() ? '🔊' : '🔇';
    }
}

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

function initializeApp() {
    setupNavigation();
    initializeTheme();
    initializeSoundToggle();
    setupThemeButtons();
}
