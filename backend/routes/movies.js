const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

const AI_ENGINE = 'http://localhost:8000';

// @route   GET api/movies/home
// @desc    Get Home Feed (delegates to AI Engine)
router.get('/home', async (req, res) => {
    try {
        const userId = req.query.userId;
        const url = userId ? `${AI_ENGINE}/api/smart/home_feed?user_id=${userId}` : `${AI_ENGINE}/api/smart/home_feed`;
        const response = await axios.get(url, { timeout: 8000 });
        res.json(response.data);
    } catch (err) {
        console.error('Error fetching home feed from AI engine:', err.message);
        res.json({});
    }
});

// @route   GET api/movies/:id
// @desc    Get Movie Details — proxied from AI Engine which fetches cast via Google
router.get('/:id', async (req, res) => {
    const movieId = req.params.id;

    try {
        // Proxy to AI Engine's movie details endpoint which scrapes Google for real cast
        const response = await axios.get(`${AI_ENGINE}/api/movies/${movieId}`, { timeout: 15000 });
        const data = response.data;

        // Ensure cast is in the right format for the frontend
        const cast = Array.isArray(data.cast) ? data.cast : [];

        res.json({
            movie_id: data.movie_id || parseInt(movieId),
            title: data.title || "Unknown",
            genres: data.genres || ["Drama"],
            rating: data.rating || "N/A",
            release_year: data.release_year || "Unknown",
            duration: data.duration || 120,
            languages: data.languages || ["English"],
            description: data.description || "",
            trailer_url: data.trailer_url || null,
            poster: `/api/ai/poster/${movieId}`,
            cast: cast.map(c => ({
                name: c.name || "Unknown",
                character: c.character || "",
                image: c.image || null
            })),
            director: data.director || "Unknown",
            producers: data.producers || ["Unknown"],
            hero: cast.length > 0 ? cast[0].name : "Unknown",
            heroine: cast.length > 1 ? cast[1].name : "Unknown"
        });
    } catch (err) {
        console.error('Error fetching movie details:', err.message);
        res.json({
            movie_id: parseInt(movieId),
            title: "Movie",
            genres: ["Drama"],
            rating: "N/A",
            release_year: "Unknown",
            duration: 120,
            languages: ["English"],
            description: "Movie details are currently loading...",
            trailer_url: null,
            poster: `/api/ai/poster/${movieId}`,
            cast: [{ name: "Loading cast...", character: "", image: null }],
            director: "Unknown",
            producers: ["Unknown"],
            hero: "Unknown",
            heroine: "Unknown"
        });
    }
});

// @route   POST api/movies/watchlist
router.post('/watchlist', auth, async (req, res) => {
    try {
        const { movieId } = req.body;
        const response = await axios.post(`${AI_ENGINE}/api/watchlist/add`, {
            user_id: req.auth.userId,
            movie_id: movieId
        });
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error adding to watchlist' });
    }
});

// @route   GET api/movies/watchlist/:profileId
router.get('/watchlist/:profileId', auth, async (req, res) => {
    try {
        res.json([]);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
