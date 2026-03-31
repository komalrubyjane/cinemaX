"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { fetchMovies, fetchRecommendations, posterUrl, type MovieSummary } from "@/lib/api";

const GENRES = ["Action", "Adventure", "Animation", "Biography", "Crime", "Comedy", "Documentary", "Drama"];

// ── Exact Netflix Clone Hero Banner ──────────────────────────────────────────
function HeroBanner({ movies }: { movies: MovieSummary[] }) {
    const [idx, setIdx] = useState(0);

    // Auto-cycle the hero movie every 8 seconds exactly like Netflix
    useEffect(() => {
        if (movies.length < 2) return;
        const timer = setInterval(() => setIdx(i => (i + 1) % Math.min(movies.length, 5)), 8000);
        return () => clearInterval(timer);
    }, [movies]);

    if (!movies.length) return null;
    const movie = movies[idx];
    const cleanTitle = movie.title.replace(/\(\d{4}\)/, "").trim();

    return (
        <div className="relative w-full h-[85vh] mb-8 overflow-hidden bg-[#0a0a0f] flex items-center">
            {/* Background Image with Netflix Slow Zoom (Ken Burns effect) */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    className="absolute inset-0 bg-cover bg-top opacity-50"
                    style={{ backgroundImage: `url(${posterUrl(movie.movieId)})` }}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 0.5, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8 } }}
                    transition={{ duration: 8, ease: "linear" }}
                />
            </AnimatePresence>

            {/* Fading gradients for the Netflix look */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 via-[#0a0a0f]/40 to-transparent" />

            {/* Content Container with staggered entrance */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`text-${idx}`}
                    className="relative z-10 pl-12 md:pl-20 max-w-3xl"
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.4 } }}
                    transition={{ duration: 0.8, ease: "easeOut", staggerChildren: 0.1 }}
                >
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-[var(--text-secondary)] text-xs md:text-sm font-medium mb-1 tracking-widest uppercase"
                    >
                        Duration: {movie.duration || 120}m
                    </motion.p>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="text-white text-sm font-semibold mb-4 flex items-center gap-2"
                    >
                        <span className="text-[#e50914] font-black">N</span>
                        <span className="text-[#f5c518] hidden md:inline">★ 7.5</span>
                        <span className="text-white font-medium">{movie.genre} - Just added</span>
                    </motion.p>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="text-5xl md:text-8xl font-black mb-6 tracking-tight leading-[0.9] text-white" 
                        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", textShadow: "2px 2px 4px rgba(0,0,0,0.45)" }}
                    >
                        {cleanTitle}
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="text-white/90 text-sm md:text-lg mb-8 max-w-xl leading-relaxed text-shadow"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                    >
                        A thrilling exploration of {movie.genre.toLowerCase()} elements that keeps you on the edge of your seat. Experience one of the top rated movies of its time, full of breathtaking moments and unforgettable performances.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="flex items-center gap-4"
                    >
                        <Link 
                            href={`/movie/${movie.movieId}`} 
                            className="bg-white text-black text-sm md:text-lg font-bold px-6 py-2 md:px-8 md:py-3 rounded-[4px] flex items-center gap-3 transition hover:bg-white/80 active:scale-95"
                        >
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            Play
                        </Link>
                        <button className="bg-zinc-500/50 text-white text-sm md:text-lg font-bold px-6 py-2 md:px-8 md:py-3 rounded-[4px] flex items-center gap-3 transition hover:bg-zinc-500/30 active:scale-95">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            More Info
                        </button>
                    </motion.div>

                    {/* Simple dots inside hero for switching manually */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                        className="flex items-center gap-3 mt-16"
                    >
                        {movies.slice(0, 4).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIdx(i)}
                                className={`h-1 transition-all duration-300 ${i === idx ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/50"}`}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ── Trends Now / Genre Filters ──────────────────────────────────────────────
function TrendsNow({ movies }: { movies: MovieSummary[] }) {
    const [activeGenre, setActiveGenre] = useState("Action");
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: "left" | "right") => {
        if (!rowRef.current) return;
        rowRef.current.scrollBy({ left: dir === "right" ? window.innerWidth * 0.75 : -(window.innerWidth * 0.75), behavior: "smooth" });
    };

    const displayMovies = movies.filter(m => m.genre && m.genre.toLowerCase().includes(activeGenre.toLowerCase()));
    const finalMovies = displayMovies.length > 0 ? displayMovies : movies;

    return (
        <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="px-8 md:px-12 mb-16 relative z-20"
        >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between pb-4 mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-[1.4vw] font-bold text-[#e5e5e5] hover:text-white cursor-pointer transition flex items-center gap-2 tracking-medium group">
                        Trends Now
                        <span className="text-[#54b9c5] opacity-0 group-hover:opacity-100 transition-opacity text-sm -translate-x-2 group-hover:translate-x-0 ml-1">Explore All ›</span>
                    </h2>
                </div>
            </div>

            {/* Genre Pills */}
            <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar pb-2">
                {GENRES.map(g => (
                    <button
                        key={g}
                        onClick={() => setActiveGenre(g)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${
                            activeGenre === g 
                            ? "bg-white text-black border-white scale-105" 
                            : "bg-transparent text-white/70 border-white/40 hover:border-white hover:text-white hover:scale-105"
                        }`}
                    >
                        {g}
                    </button>
                ))}
            </div>

            {/* Movies Row */}
            <div className="relative group/row">
                <button 
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-0 -ml-8 z-40 w-12 bg-black/70 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/90 hover:scale-110"
                >
                    <svg className="w-8 h-8 text-white scale-y-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex gap-[0.4vw] overflow-x-auto overflow-y-hidden scroll-smooth snap-x no-scrollbar pb-[4vw] pt-[2vw] -mt-[2vw] px-1" ref={rowRef}>
                    {finalMovies.map((m, i) => (
                        <div 
                            key={`${m.movieId}-${i}`} 
                            // Netflix exact expanding effect on hover
                            className="flex-shrink-0 w-[14vw] sm:w-[15vw] md:w-[16vw] lg:w-[16.5vw] aspect-[2/3] relative group/card cursor-pointer transition-transform duration-300 origin-bottom hover:scale-[1.3] hover:z-50 delay-75 ease-out shadow-none hover:shadow-2xl hover:shadow-black"
                        >
                            <Link href={`/movie/${m.movieId}`} className="absolute inset-0 rounded-[0.2vw] overflow-hidden">
                                <img src={posterUrl(m.movieId)} alt={m.title} className="w-full h-full object-cover rounded-[0.2vw]" loading="lazy" />
                                
                                {/* Info Box that fades in from bottom within the scaled card */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                                    <div className="flex gap-2 items-center mb-1">
                                        <button className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black hover:bg-neutral-300 pointer-events-auto">
                                            <svg className="w-3 h-3 fill-current ml-[2px]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </button>
                                        <button className="w-6 h-6 border-2 border-white/50 rounded-full flex items-center justify-center text-white hover:border-white hover:bg-white/20 pointer-events-auto">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                                        </button>
                                        <button className="w-6 h-6 border-2 border-white/50 rounded-full flex items-center justify-center text-white hover:border-white hover:bg-white/20 pointer-events-auto ml-auto">
                                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
                                        </button>
                                    </div>
                                    <h3 className="text-white font-bold text-[0.8rem] line-clamp-1 leading-snug">{m.title}</h3>
                                    <p className="text-green-500 font-bold text-[0.6rem] mt-1">98% Match <span className="text-white/70 font-normal outline outline-1 outline-white/40 px-1 ml-1 rounded-[2px] opacity-80">{m.content_rating || 'PG-13'}</span></p>
                                    <p className="text-white/90 text-[0.6rem] mt-1 font-semibold flex items-center gap-1">
                                        {m.genre.split(', ')[0]} <span className="w-1 h-1 bg-white/40 rounded-full"></span> 
                                        {m.duration}m
                                    </p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 -mr-8 z-40 w-12 bg-black/70 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/90 hover:scale-110"
                >
                    <svg className="w-8 h-8 text-white scale-y-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </motion.section>
    );
}

// ── Standard Content Row (Used for other categories) ─────────────────────────
function StandardRow({ title, movies }: { title: string; movies: MovieSummary[] }) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: "left" | "right") => {
        if (!rowRef.current) return;
        rowRef.current.scrollBy({ left: dir === "right" ? window.innerWidth * 0.75 : -(window.innerWidth * 0.75), behavior: "smooth" });
    };

    return (
        <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="px-8 md:px-12 mb-[3vw] relative z-10"
        >
            <h2 className="text-[1.4vw] font-bold text-[#e5e5e5] hover:text-white cursor-pointer transition flex items-center gap-2 tracking-medium group mb-3">
                {title}
                <span className="text-[#54b9c5] opacity-0 group-hover:opacity-100 transition-opacity text-sm -translate-x-2 group-hover:translate-x-0">Explore All ›</span>
            </h2>
            <div className="relative group/row">
                <button 
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-0 bottom-0 -ml-8 z-40 w-12 bg-black/70 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/90 hover:scale-110"
                >
                    <svg className="w-8 h-8 text-white scale-y-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex gap-[0.4vw] overflow-x-auto overflow-y-hidden scroll-smooth snap-x no-scrollbar pb-[4vw] pt-[2vw] -mt-[2vw] px-1" ref={rowRef}>
                    {movies.map((m, i) => (
                        <div 
                            key={`${m.movieId}-${i}`} 
                            className="flex-shrink-0 w-[14vw] sm:w-[15vw] md:w-[16vw] lg:w-[16.5vw] aspect-[2/3] relative group/card cursor-pointer transition-transform duration-300 origin-bottom hover:scale-[1.3] hover:z-50 delay-75 ease-out shadow-none hover:shadow-2xl hover:shadow-black bg-[#181818] rounded-[0.2vw]"
                        >
                            <Link href={`/movie/${m.movieId}`} className="absolute inset-0 rounded-[0.2vw] overflow-hidden">
                                <img src={posterUrl(m.movieId)} alt={m.title} className="w-full h-full object-cover rounded-[0.2vw]" loading="lazy" />
                                
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                                    <div className="flex gap-2 items-center mb-1">
                                        <button className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black hover:bg-neutral-300 pointer-events-auto shadow-sm">
                                            <svg className="w-3 h-3 fill-current ml-[2px]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </button>
                                        <button className="w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-white hover:border-white hover:bg-white/20 pointer-events-auto">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                                        </button>
                                        <button className="w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-white hover:border-white hover:bg-white/20 pointer-events-auto ml-auto">
                                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
                                        </button>
                                    </div>
                                    <h3 className="text-white font-bold text-[0.8rem] line-clamp-1 leading-snug">{m.title}</h3>
                                    <p className="text-green-500 font-bold text-[0.6rem] mt-1 flex items-center">
                                        <span className="text-[#f5c518] mr-1">★ 7.5</span> 98% Match 
                                        <span className="text-white/70 font-normal outline outline-1 outline-white/30 px-1 ml-2 rounded-[2px] opacity-80">{m.content_rating || 'PG-13'}</span>
                                    </p>
                                    <p className="text-white text-[0.6rem] mt-1 font-semibold flex items-center gap-1 opacity-90">
                                        {m.genre.split(', ')[0]} <span className="w-[3px] h-[3px] bg-white/40 rounded-full mx-[2px]"></span> 
                                        {m.genre.split(', ')[1] || 'Drama'} 
                                    </p>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-0 bottom-0 -mr-8 z-40 w-12 bg-black/70 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/90 hover:scale-110"
                >
                    <svg className="w-8 h-8 text-white scale-y-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </motion.section>
    );
}

export default function HomePage() {
    const router = useRouter();
    const [movies, setMovies] = useState<Record<string, MovieSummary[]>>({});
    const [recs, setRecs] = useState<MovieSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        if (!token || !storedUserId) { router.push("/login"); return; }
        setUserId(storedUserId);
        setAuthReady(true);
    }, [router]);

    useEffect(() => {
        if (!authReady || !userId) return;
        async function load() {
            try {
                const [allMovies, recommendations] = await Promise.all([
                    fetchMovies(userId as string),
                    fetchRecommendations(userId as string),
                ]);
                setMovies(allMovies || {});
                setRecs(recommendations || []);
            } catch (e) {
                console.error("Error loading movies:", e);
            }
            setLoading(false);
        }
        load();
    }, [authReady, userId]);

    const allMoviesList = Object.values(movies).flat();

    if (!authReady) {
        return <main className="min-h-screen bg-[#141414]"></main>;
    }

    // Prepare hero
    const heroMovies = [...(recs.length ? recs : []), ...allMoviesList].filter((m, i, a) => a.findIndex(t => t.movieId === m.movieId) === i).slice(0, 5);

    return (
        <main className="min-h-screen bg-[#141414] text-white selection:bg-[#e50914] selection:text-white pb-24 overflow-x-hidden">
            <Navbar />

            {loading ? (
                <div className="relative w-full h-[85vh] bg-[#141414] animate-pulse" />
            ) : (
                <HeroBanner movies={heroMovies} />
            )}

            <div className="relative z-20 -top-[10vh]">
                {/* Trends Now matching reference image */}
                {!loading && allMoviesList.length > 0 && (
                    <TrendsNow movies={[...allMoviesList].sort(() => Math.random() - 0.5).slice(0, 50)} />
                )}

                {/* Other Rows */}
                {!loading && recs.length > 0 && (
                    <StandardRow title="Recommended For You" movies={recs} />
                )}

                {!loading && Object.entries(movies).slice(0, 3).map(([category, rowMovies]) =>
                    rowMovies && rowMovies.length > 0 ? (
                        <StandardRow key={category} title={category} movies={rowMovies} />
                    ) : null
                )}
            </div>
        </main>
    );
}
