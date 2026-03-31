const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cinematch';

const startDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        // On Vercel / serverless, mongodb-memory-server cannot download binaries.
        // Log the error but let the app start — routes will return 503 if DB is needed.
        console.warn(`[DB] MongoDB connection failed: ${err.message}`);
        console.warn('[DB] Running without database — auth is handled by Python service on Vercel.');
    }
};
startDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/movies', require('./routes/movies'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'CINEMAX Backend' });
});

// Socket.io for Watch Party
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Only bind a port when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app for completely standalone Vercel Serverless deployment
module.exports = app;
