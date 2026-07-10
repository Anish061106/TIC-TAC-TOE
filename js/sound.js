// ========================================
// SOUND ENGINE (Web Audio API)
// ========================================

const SoundEngine = (() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    /**
     * Play a sine wave tone
     */
    function playTone(frequency, duration, volume = 0.3) {
        if (!isSoundEnabled()) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    /**
     * Play click sound
     */
    function playClick() {
        playTone(400, 0.1, 0.2);
    }

    /**
     * Play win sound (ascending tones)
     */
    function playWin() {
        playTone(523, 0.2, 0.3); // C
        setTimeout(() => playTone(659, 0.2, 0.3), 150); // E
        setTimeout(() => playTone(784, 0.3, 0.3), 300); // G
    }

    /**
     * Play draw sound (flat buzz)
     */
    function playDraw() {
        playTone(200, 0.3, 0.2);
    }

    /**
     * Play whoosh sound
     */
    function playWhoosh() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    return { playClick, playWin, playDraw, playWhoosh };
})();
