const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    avatar: { type: String, default: 'default_avatar.png' },
    type: {
        type: String,
        enum: ['Adult', 'Kids', 'Family'],
        default: 'Adult'
    },
    preferences: {
        favoriteGenres: [String],
        moodHistory: [String]
    }
});

const userSchema = new mongoose.Schema({
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    phone: { type: String },
    profiles: [profileSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
