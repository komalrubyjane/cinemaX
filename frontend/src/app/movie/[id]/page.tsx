"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { fetchMovieDetail, fetchSimilarMovies, posterUrl, createWatchParty, addToWatchlist, type MovieDetail, type MovieSummary } from "@/lib/api";

export default function MovieDetailPage() {
    const params = useParams();
    const movieId = Number(params.id);
    const [movie, setMovie] = useState<MovieDetail | null>(null);
    const [similar, setSimilar] = useState<MovieSummary[]>([]);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [partyLink, setPartyLink] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const [detail, similarMovies] = await Promise.all([
                fetchMovieDetail(movieId),
                fetchSimilarMovies(movieId),
            ]);
            setMovie(detail);
            setSimilar(similarMovies || []);
        }
        load();
    }, [movieId]);

    const handleAddWatchlist = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await addToWatchlist(movieId, token);
                setInWatchlist(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleStartParty = async () => {
        const userId = localStorage.getItem("userId");
        const result = await createWatchParty(movieId, userId || undefined);
        setPartyLink(`/party/${result.room_id}?movie=${movieId}`);
    };

    if (!movie) {
        return (
            <main className="min-h-screen">
                <Navbar />
                <div className="pt-24 px-12">
                    <div className="w-full h-[60vh] shimmer rounded-2xl mb-8" />
                    <div className="w-1/3 h-10 shimmer rounded-lg mb-4" />
                    <div className="w-2/3 h-6 shimmer rounded-lg" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <Navbar />

            {/* HD Banner */}
            <div className="relative w-full h-[75vh]">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${movie.poster})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)]/90 via-transparent to-transparent" />
            </div>

            <div className="relative -mt-64 px-6 md:px-12 pb-20 z-10">
                <div className="flex flex-col md:flex-row gap-10">
                    {/* Poster */}
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex-shrink-0 w-[280px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
                    >
                        <Image
                            src={movie.poster}
                            alt={movie.title}
                            width={280}
                            height={420}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    </motion.div>

                    {/* Details */}
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1 max-w-2xl"
                    >
                        <h1 className="text-4xl md:text-5xl font-black mb-3">{movie.title}</h1>

                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-[var(--gold)] font-bold text-lg">★ {movie.rating || "NR"}</span>
                            <span className="text-[var(--text-secondary)]">{movie.release_year || "Unknown"}</span>
                            <span className="text-[var(--text-secondary)]">{movie.duration || "120"} min</span>
                            <span className="px-2 py-1 text-xs rounded bg-white/10 border border-white/20">{movie.genres?.[0] || "Drama"}</span>
                        </div>

                        {/* Languages */}
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {movie.languages?.map((lang) => (
                                <span
                                    key={lang}
                                    className="px-3 py-1 text-xs rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 text-[var(--accent)]"
                                >
                                    {lang.trim()}
                                </span>
                            ))}
                        </div>

                        <p className="text-[var(--text-secondary)] text-base mb-6 leading-relaxed">
                            {movie.description}
                        </p>

                        {/* Credits Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8 text-sm bg-black/30 p-4 rounded-xl border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[var(--text-secondary)] mb-1 text-xs uppercase tracking-wider">Director</span>
                                <span className="font-semibold text-white">{movie.director || "Unknown"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[var(--text-secondary)] mb-1 text-xs uppercase tracking-wider">Producers</span>
                                <span className="font-semibold text-white line-clamp-1">{movie.producers?.join(", ") || "Unknown"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[var(--text-secondary)] mb-1 text-xs uppercase tracking-wider">Hero</span>
                                <span className="font-semibold text-[var(--accent)]">{movie.hero || "Unknown"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[var(--text-secondary)] mb-1 text-xs uppercase tracking-wider">Heroine</span>
                                <span className="font-semibold text-[var(--accent)]">{movie.heroine || "Unknown"}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mb-8 flex-wrap">
                            {movie.trailer_url && (
                                <a
                                    href={movie.trailer_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary flex items-center gap-2"
                                >
                                    ▶ Watch Trailer
                                </a>
                            )}
                            <button
                                onClick={handleAddWatchlist}
                                className={`btn-secondary ${inWatchlist ? "!bg-green-600/30 !border-green-500" : ""}`}
                            >
                                {inWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}
                            </button>
                            <button onClick={handleStartParty} className="btn-secondary">
                                🎉 Start Watch Party
                            </button>
                        </div>

                        {partyLink && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4 mb-6"
                            >
                                <p className="text-sm text-[var(--text-secondary)] mb-1">Share this link to invite friends:</p>
                                <code className="text-[var(--accent)] text-sm break-all">
                                    {typeof window !== "undefined" ? window.location.origin : ""}{partyLink}
                                </code>
                            </motion.div>
                        )}

                        {/* Cast */}
                        <h3 className="text-xl font-bold mb-4">Cast</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {movie.cast?.map((actor, i) => (
                                <motion.div
                                    key={i}
                                    className="flex-shrink-0 text-center cursor-pointer group"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-[var(--accent)] transition mb-2">
                                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                                            {actor.image ? (
                                                <Image
                                                    src={actor.image}
                                                    alt={actor.name}
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                "No Image"
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-[var(--text-secondary)] group-hover:text-white transition line-clamp-2">
                                        {actor.name}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Because You Watched */}
                {similar.length > 0 && (
                    <section className="mt-16 max-w-5xl mx-auto md:mx-0">
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-4">
                            More Like This
                            <div className="h-px bg-white/20 flex-1 ml-4" />
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {similar.map((m, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={`${m.movieId}-${idx}`} 
                                    className="bg-[#2f2f2f] rounded flex flex-col group cursor-pointer overflow-hidden relative aspect-[2/3] shadow-lg border border-transparent hover:border-white/20 transition-all duration-300"
                                >
                                    <Link href={`/movie/${m.movieId}`}>
                                        <div className="absolute inset-0 bg-[#16161a]">
                                            <img src={posterUrl(m.movieId)} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                            <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center bg-black/40 mb-2 shadow-xl hover:bg-white hover:text-black transition">
                                                <svg className="w-4 h-4 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                            <h3 className="text-white text-sm font-bold line-clamp-1">{m.title}</h3>
                                            <p className="text-green-500 font-bold text-xs mt-1">98% Match</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
