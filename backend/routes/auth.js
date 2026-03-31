const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/sync
// @desc    Sync Supabase user with MongoDB database
router.post('/sync', auth, async (req, res) => {
    try {
        const supabaseId = req.auth.userId;
        const email = req.auth.email || 'unknown@supabase.com';

        // Find existing user
        let user = await User.findOne({ supabaseId });

        if (!user) {
            // New user, create them
            user = new User({
                supabaseId,
                email,
            });

            // Initial default profile
            user.profiles.push({
                name: 'Main Viewer',
                type: 'Adult'
            });

            await user.save();
        }

        res.json({ user, profiles: user.profiles });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error during sync');
    }
});

// @route   GET api/auth/me
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
