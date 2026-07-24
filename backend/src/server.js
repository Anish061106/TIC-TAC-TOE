const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, '../data/stats.json');

// Ensure data folder and file exist
function ensureDataFile() {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ scoreboard: {}, history: [] }, null, 2));
    }
}

function loadData() {
    try {
        ensureDataFile();
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Error reading stats.json:', err);
        return { scoreboard: {}, history: [] };
    }
}

function saveData(data) {
    try {
        ensureDataFile();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing stats.json:', err);
    }
}

// CORS setup
const allowedOrigins = [
    'https://tic-tac-toe-pi-gray-92.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
];

if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(...process.env.CORS_ORIGIN.split(',').map(s => s.trim()));
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*') {
            callback(null, true);
        } else {
            callback(null, true); // Allow for flexibility in demo/testing
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Health Check Endpoints for Render
app.get(['/', '/api/health'], (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'Tic-Tac-Toe Nexus Grid Backend',
        timestamp: new Date().toISOString(),
        allowedOrigin: process.env.CORS_ORIGIN || 'https://tic-tac-toe-pi-gray-92.vercel.app'
    });
});

// GET /api/stats - Retrieve all statistics & history
app.get('/api/stats', (req, res) => {
    const data = loadData();
    res.json(data);
});

// POST /api/game-result - Save a game result and update scoreboard
app.post('/api/game-result', (req, res) => {
    const { player1, player2, mode, result, winner } = req.body;

    if (!player1 || !player2 || !result) {
        return res.status(400).json({ error: 'Missing required game result fields' });
    }

    const data = loadData();
    const p1 = player1.trim() || 'Player 1';
    const p2 = player2.trim() || 'Player 2';
    const requestTime = req.body.date ? new Date(req.body.date).getTime() : Date.now();

    // Deduplication check: ignore if exact same match posted within 5 seconds
    const isDuplicate = data.history.some(rec => {
        const recTime = new Date(rec.date).getTime();
        return rec.player1 === p1 &&
            rec.player2 === p2 &&
            rec.mode === (mode || 'Local') &&
            Math.abs(requestTime - recTime) < 5000;
    });

    if (isDuplicate) {
        return res.json({
            success: true,
            message: 'Duplicate game result ignored',
            scoreboard: data.scoreboard,
            historyCount: data.history.length
        });
    }

    if (!data.scoreboard[p1]) {
        data.scoreboard[p1] = { wins: 0, losses: 0, draws: 0 };
    }
    if (!data.scoreboard[p2]) {
        data.scoreboard[p2] = { wins: 0, losses: 0, draws: 0 };
    }

    if (winner === 'draw' || result.toLowerCase().includes('draw')) {
        data.scoreboard[p1].draws++;
        data.scoreboard[p2].draws++;
    } else if (winner === 'player1' || result.includes(p1)) {
        data.scoreboard[p1].wins++;
        data.scoreboard[p2].losses++;
    } else if (winner === 'player2' || result.includes(p2)) {
        data.scoreboard[p2].wins++;
        data.scoreboard[p1].losses++;
    }

    const gameRecord = {
        date: req.body.date || new Date().toISOString(),
        mode: mode || 'Local',
        player1: p1,
        player2: p2,
        result: result
    };

    data.history.push(gameRecord);

    // Keep history capped at 100 recent games
    if (data.history.length > 100) {
        data.history = data.history.slice(-100);
    }

    saveData(data);

    res.json({
        success: true,
        message: 'Game result recorded',
        scoreboard: data.scoreboard,
        historyCount: data.history.length
    });
});

// DELETE /api/stats - Clear all stats
app.delete('/api/stats', (req, res) => {
    const emptyData = { scoreboard: {}, history: [] };
    saveData(emptyData);
    res.json({ success: true, message: 'All statistics cleared' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Tic-Tac-Toe Backend running on port ${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});
