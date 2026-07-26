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

// Online Multiplayer Cloud Relay & Backend API Helpers
async function publishCloudRelay(roomCode, payload) {
    try {
        await fetch(`https://ntfy.sh/tictactoe_nexus_${encodeURIComponent(roomCode)}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.warn('Cloud relay publish failed:', e);
    }
}

async function fetchCloudRelayRoom(roomCode) {
    try {
        const url = `https://ntfy.sh/tictactoe_nexus_${encodeURIComponent(roomCode)}/json?poll=1`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const text = await res.text();
        if (!text || !text.trim()) return null;

        const lines = text.trim().split('\n');
        let roomState = null;
        const chatMsgs = [];

        for (const line of lines) {
            try {
                const item = JSON.parse(line);
                if (item.event === 'message' && item.message) {
                    const msg = JSON.parse(item.message);
                    if (msg.type === 'ROOM_CREATE') {
                        roomState = {
                            roomCode: msg.roomCode || roomCode,
                            player1Name: msg.player1Name || 'Player 1',
                            player2Name: msg.player2Name || null,
                            board: msg.board || ['', '', '', '', '', '', '', '', ''],
                            currentPlayer: msg.currentPlayer || 'X',
                            messages: []
                        };
                    } else if (msg.type === 'ROOM_JOIN') {
                        if (!roomState) {
                            roomState = {
                                roomCode: roomCode,
                                player1Name: 'Player 1',
                                player2Name: msg.player2Name || 'Player 2',
                                board: ['', '', '', '', '', '', '', '', ''],
                                currentPlayer: 'X',
                                messages: []
                            };
                        } else {
                            roomState.player2Name = msg.player2Name || 'Player 2';
                        }
                    } else if (msg.type === 'ROOM_MOVE' && roomState) {
                        if (msg.board) roomState.board = msg.board;
                        if (msg.currentPlayer) roomState.currentPlayer = msg.currentPlayer;
                        if (msg.player1Name) roomState.player1Name = msg.player1Name;
                        if (msg.player2Name) roomState.player2Name = msg.player2Name;
                    } else if (msg.type === 'CHAT_MSG') {
                        chatMsgs.push({ sender: msg.sender || 'Player', text: msg.text, timestamp: (item.time || Date.now() / 1000) * 1000 });
                    }
                }
            } catch (e) {}
        }

        if (roomState) {
            roomState.messages = chatMsgs;
            return roomState;
        }
    } catch (err) {
        console.warn('Cloud relay fetch error:', err);
    }
    return null;
}

async function createOnlineRoomApi(roomCode, player1Name) {
    const payload = {
        type: 'ROOM_CREATE',
        roomCode,
        player1Name,
        player2Name: null,
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X'
    };
    publishCloudRelay(roomCode, payload);

    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (backendUrl) {
        try {
            const res = await fetch(`${backendUrl}/api/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomCode, player1Name })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.room) return data.room;
            }
        } catch (err) {
            console.warn('Backend room creation failed:', err);
        }
    }
    return null;
}

async function fetchOnlineRoomApi(roomCode) {
    // 1. Try Backend API if configured
    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (backendUrl) {
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${encodeURIComponent(roomCode)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.room) return data.room;
            }
        } catch (err) {
            console.warn('Backend room fetch failed:', err);
        }
    }

    // 2. Try Cloud Relay (ntfy.sh) - works globally across all devices/networks
    const cloudRoom = await fetchCloudRelayRoom(roomCode);
    if (cloudRoom) return cloudRoom;

    return null;
}

async function joinOnlineRoomApi(roomCode, player2Name) {
    publishCloudRelay(roomCode, { type: 'ROOM_JOIN', player2Name });

    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (backendUrl) {
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${encodeURIComponent(roomCode)}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player2Name })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.room) return data.room;
            }
        } catch (err) {
            console.warn('Backend room join failed:', err);
        }
    }
    return null;
}

async function syncOnlineRoomMoveApi(roomCode, roomData) {
    publishCloudRelay(roomCode, {
        type: 'ROOM_MOVE',
        board: roomData.board,
        currentPlayer: roomData.currentPlayer,
        player1Name: roomData.player1Name,
        player2Name: roomData.player2Name
    });

    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (backendUrl) {
        try {
            await fetch(`${backendUrl}/api/rooms/${encodeURIComponent(roomCode)}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomData)
            });
        } catch (err) {
            console.warn('Backend move sync failed:', err);
        }
    }
}

async function sendChatMessageApi(roomCode, sender, text) {
    publishCloudRelay(roomCode, { type: 'CHAT_MSG', sender, text });

    const backendUrl = typeof CONFIG !== 'undefined' ? CONFIG.BACKEND_URL : '';
    if (backendUrl) {
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${encodeURIComponent(roomCode)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender, text })
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.messages) return data.messages;
            }
        } catch (err) {
            console.warn('Backend chat send failed:', err);
        }
    }
    return null;
}



