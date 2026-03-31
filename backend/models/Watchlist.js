const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    movieId: { type: String, required: true }, // We can use TMDB IDs as String/Number
    title: { type: String, required: true },
    posterPath: { type: String },
    addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
