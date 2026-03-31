const NODE_BASE = "/api/backend";
const PYTHON_BASE = "/api/ai";

export interface MovieSummary {
    movieId: number;
    title: string;
    genre: string;
    content_rating: string;
    duration: number;
    mood: string;
    poster: string;
    progress?: number;
}

export interface MovieDetail {
    movie_id: number;
    title: string;
    genres: string[];
    rating: number | string;
    release_year: number | string;
    duration: number;
    languages: string[];
    description: string;
    trailer_url: string;
    poster: string;
    cast: { name: string; image: string; character?: string }[];
    director?: string;
    producers?: string[];
    hero?: string;
    heroine?: string;
}

// Auto-retry with exponential backoff — handles Vercel cold starts
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout per attempt
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok || res.status === 404) return res; // don't retry 404s
            throw new Error(`HTTP ${res.status}`);
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1500 * (i + 1))); // 1.5s, 3s delay
        }
    }
    throw new Error("Max retries exceeded");
}

// Function to attach Supabase auth token if provided
const getHeaders = (token?: string | null) => {
    const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

export async function fetchMovies(userId?: string): Promise<Record<string, MovieSummary[]>> {
    const url = userId ? `${PYTHON_BASE}/smart/home_feed?user_id=${userId}` : `${PYTHON_BASE}/smart/home_feed`;
    const res = await fetch(url, { 
        headers: getHeaders(),
        cache: "no-store", 
        next: { revalidate: 3600 } 
    });
    const data = await res.json();
    return data || {};
}

export async function fetchMovieDetail(id: number): Promise<MovieDetail> {
    const res = await fetchWithRetry(`${PYTHON_BASE}/movies/${id}`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}

export async function fetchSimilarMovies(id: number): Promise<MovieSummary[]> {
    const res = await fetchWithRetry(`${PYTHON_BASE}/movies/${id}/similar`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}

export async function fetchMovieCast(id: number): Promise<any> {
    const res = await fetchWithRetry(`${PYTHON_BASE}/movies/${id}/cast`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}


export async function fetchRecommendations(userId: string | number): Promise<MovieSummary[]> {
    const res = await fetch(`/recommend/${userId}`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
    const res = await fetch(`${PYTHON_BASE}/search?query=${encodeURIComponent(query)}`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}

export async function loginLocal(data: any) {
    const res = await fetch(`${PYTHON_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function signupLocal(data: any) {
    const res = await fetch(`${PYTHON_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Bypass-Tunnel-Reminder": "true" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function syncLocalUser(token: string) {
    const res = await fetch(`${NODE_BASE}/auth/sync`, {
        method: "POST",
        headers: getHeaders(token),
    });
    return res.json();
}

export async function createWatchParty(movieId: number, userId?: string) {
    const url = userId ? `${PYTHON_BASE}/party/create?movie_id=${movieId}&host_id=${userId}` : `${PYTHON_BASE}/party/create?movie_id=${movieId}`;
    const res = await fetch(url, { method: "POST", headers: { "Bypass-Tunnel-Reminder": "true" } });
    return res.json();
}

export async function addToWatchlist(movieId: number, userId: number, token: string) {
    const res = await fetch(`${PYTHON_BASE}/watchlist/add`, {
        method: "POST",
        headers: getHeaders(token),
        body: JSON.stringify({ movie_id: movieId, user_id: userId })
    });
    return res.json();
}

export function posterUrl(movieId: number): string {
    return `${PYTHON_BASE}/poster/${movieId}`;
}

export async function fetchMoodMovies(mood: string): Promise<MovieSummary[]> {
    const res = await fetch(`${PYTHON_BASE}/smart/mood/${mood}`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}

export async function fetchFamilyMovies(): Promise<MovieSummary[]> {
    const res = await fetch(`${PYTHON_BASE}/smart/family`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}

export async function fetchKidsMovies(): Promise<MovieSummary[]> {
    const res = await fetch(`${PYTHON_BASE}/smart/kids`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}

export interface BehaviorProfile {
    total_watched: number;
    avg_completion: number;
    favorite_time: string;
    top_genres: string[];
    behavior_tags: string[];
    mood_tendency: string;
    binge_score: number;
    diversity_score: number;
    insights: string[];
    language_breakdown: Record<string, number>;
}

export async function fetchBehaviorProfile(userId: number): Promise<BehaviorProfile> {
    const res = await fetch(`${PYTHON_BASE}/smart/behavior/${userId}`, { 
        headers: { "Bypass-Tunnel-Reminder": "true" },
        cache: "no-store" 
    });
    return res.json();
}
