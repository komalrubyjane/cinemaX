const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'cinemax_secret_key_2024';

// @route   POST /api/auth/signup
// @desc    Register a new user with username + password
router.post('/signup', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password) {
            return res.status(400).json({ detail: 'Username and password are required.' });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(409).json({ detail: 'Username already taken.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            passwordHash,
            email: email || `${username}@cinemax.local`,
        });

        user.profiles.push({ name: 'Main Viewer', type: 'Adult' });
        await user.save();

        res.status(201).json({ status: 'user_created', userId: user._id });
    } catch (err) {
        console.error('Signup error:', err.message);
        res.status(500).json({ detail: 'Server error during signup.' });
    }
});

// @route   POST /api/auth/login
// @desc    Login with username + password
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ detail: 'Username and password are required.' });
        }

        const user = await User.findOne({ username });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ detail: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ detail: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            status: 'success',
            token,
            userId: user._id,
            username: user.username,
            profiles: user.profiles
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ detail: 'Server error during login.' });
    }
});

// @route   POST /api/auth/sync
// @desc    Sync Supabase user with MongoDB database (legacy)
router.post('/sync', auth, async (req, res) => {
    try {
        const supabaseId = req.auth.userId;
        const email = req.auth.email || 'unknown@supabase.com';

        let user = await User.findOne({ supabaseId });

        if (!user) {
            user = new User({ supabaseId, email });
            user.profiles.push({ name: 'Main Viewer', type: 'Adult' });
            await user.save();
        }

        res.json({ user, profiles: user.profiles });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during sync');
    }
});

// @route   GET /api/auth/me
// @desc    Get user data
router.get('/me', auth, async (req, res) => {
    try {
        const supabaseId = req.auth.userId;
        const user = await User.findOne({ supabaseId });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
