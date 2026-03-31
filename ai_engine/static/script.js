async function getRecommendations() {
    const userInput = document.getElementById("userId");
    const container = document.getElementById("recommendations");

    if (!userInput || !container) {
        console.error("Required elements not found");
        return;
    }

    const userId = userInput.value.trim();

    if (!userId) {
        alert("Please enter a User ID");
        return;
    }

    try {
        container.innerHTML = "<p style='color:var(--neon-cyan); padding:20px;'><i class='fas fa-circle-notch fa-spin'></i> Running Neural Analysis...</p>";

        const mode = typeof CURRENT_MODE !== "undefined" ? CURRENT_MODE : "everyone";
        const family = mode === "family" ? "true" : "false";
        const children = mode === "children" ? "true" : "false";
        const age = typeof USER_AGE !== "undefined" ? USER_AGE : 18;
        const localHour = new Date().getHours();

        const moodElement = document.getElementById("userMood");
        const mood = moodElement ? moodElement.value : "";
        const durationElement = document.getElementById("maxDuration");
        const duration = durationElement ? durationElement.value : "";

        let url = userId.includes(',')
            ? `/recommend/multi?user_ids=${encodeURIComponent(userId)}&age=${age}&family=${family}&children=${children}&local_hour=${localHour}`
            : `/recommend/${userId}?age=${age}&family=${family}&children=${children}&local_hour=${localHour}`;

        if (mood) url += `&mood=${mood}`;
        if (duration) url += `&max_duration=${duration}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();
        container.innerHTML = "";

        if (!data || data.length === 0) {
            container.innerHTML = "<p style='color:var(--text-muted); padding:20px;'>No exact neural matches found. Try broadening your vibe filters.</p>";
            return;
        }

        data.forEach(movie => {
            const div = document.createElement("div");
            div.className = "futuristic-card";

            const poster = movie.poster ? movie.poster : `https://picsum.photos/seed/${movie.movieId}/300/400`;
            const genre = movie.genre || "Drama";
            const rating = movie.content_rating || "PG-13";
            const reasonsHtml = movie.reasons && movie.reasons.length > 0
                ? `<div class="card-tags">${movie.reasons.slice(0, 2).map(r => `<span class="card-tag">${r}</span>`).join('')}</div>`
                : '';
            const matchScoreHtml = movie.match_score
                ? `<div class="card-badge-top">${movie.match_score}% Match</div>`
                : '';

            const durationTxt = movie.duration ? `${movie.duration}m` : '120m';

            div.innerHTML = `
                <img class="card-poster" src="${poster}" alt="${movie.title}" onerror="this.onerror=null; this.src='https://picsum.photos/seed/${movie.movieId}/300/400';">
                ${matchScoreHtml}
                <button class="card-watchlist-btn" onclick="toggleWatchlist(${movie.movieId}, this)">
                    <i class="fas fa-plus"></i>
                </button>
                <div class="card-hover-content">
                    <h3 class="card-title">${movie.title}</h3>
                    <div class="card-metadata">
                        <span>${rating}</span>
                        <span>${genre}</span>
                        <span style="color: var(--neon-cyan);">${durationTxt}</span>
                    </div>
                    ${reasonsHtml}
                    <div class="card-actions">
                        <button class="card-btn" onclick="updateWatchProgress(${movie.movieId}, 20)"><i class="fas fa-play"></i> Neural Play</button>
                    </div>
                </div>
            `;

            container.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p style='color:var(--neon-purple); padding:20px;'>Neural Engine offline. Please try again.</p>";
    }
}