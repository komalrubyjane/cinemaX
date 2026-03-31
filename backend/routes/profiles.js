const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/profiles
// @desc    Add new profile to user account
router.post('/', auth, async (req, res) => {
    const { name, avatar, type } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const newProfile = { name, avatar, type };
        user.profiles.push(newProfile);
        await user.save();
        res.json(user.profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profiles
// @desc    Get all user profiles
router.get('/', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profiles/:profileId
// @desc    Delete a profile
router.delete('/:profileId', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        user.profiles = user.profiles.filter(p => p.id !== req.params.profileId);
        await user.save();
        res.json(user.profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
