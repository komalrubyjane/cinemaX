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
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (err) {
        console.warn(`⚠️ [DB] Local MongoDB connection failed: ${err.message}`);
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            const uri = mongoServer.getUri();
            await mongoose.connect(uri);
            console.log(`✅ [DB] Running on in-memory MongoDB: ${uri}`);
            return true;
        } catch (memErr) {
            console.warn(`⚠️ [DB] Memory server failed: ${memErr.message}`);
            console.warn('⚠️ [DB] Running without database — use admin/1234 to login.');
            return false;
        }
    }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/movies', require('./routes/movies'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'CINEMAX Backend' });
});

// Watch Party Room Storage
const ROOMS = {};

// Watch Party Room Creation
app.post('/api/ai/party/create', (req, res) => {
    const { movie_id } = req.query;
    const roomId = 'PARTY_' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Store room data
    ROOMS[roomId] = {
        movie_id: movie_id,
        created_at: new Date()
    };
    
    console.log(`Created new Watch Party room: ${roomId} for movie: ${movie_id}`);
    res.json({ room_id: roomId, movie_id: movie_id });
});

app.get('/api/ai/party/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = ROOMS[roomId];
    if (room) {
        res.json(room);
    } else {
        res.status(404).json({ error: "Room not found" });
    }
});

// Socket.io for Watch Party
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`User ${username} (${socket.id}) joined room ${roomId}`);
        
        io.in(roomId).emit('message', {
            type: 'system',
            message: `${username} joined the party! 🎉`
        });
    });

    socket.on('chat', ({ roomId, username, text }) => {
        io.in(roomId).emit('message', {
            type: 'chat',
            sender: username,
            text: text
        });
    });

    socket.on('play', ({ roomId, timestamp, username }) => {
        socket.to(roomId).emit('sync', {
            action: 'play',
            status: 'playing',
            timestamp: timestamp,
            username: username
        });
    });

    socket.on('pause', ({ roomId, timestamp, username }) => {
        socket.to(roomId).emit('sync', {
            action: 'pause',
            status: 'paused',
            timestamp: timestamp,
            username: username
        });
    });

    socket.on('seek', ({ roomId, timestamp, username }) => {
        socket.to(roomId).emit('sync', {
            action: 'seek',
            status: 'paused', // Usually paused when seeking manually
            timestamp: timestamp,
            username: username
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server immediately
if (!process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

// Initialize database in the background
startDB().catch((err) => {
    console.error('❌ Database initialization error:', err.message);
});

// Export app for completely standalone Vercel Serverless deployment
module.exports = app;
