"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { posterUrl } from "@/lib/api";

interface WatchlistMovie {
    movieId: number;
    title: string;
    genre: string;
    poster: string;
}

export default function WatchlistPage() {
    const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
    const [sortBy, setSortBy] = useState<"recent" | "genre" | "title">("recent");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/ai/search?query=");
                const allMovies = await res.json();
                // Simulate watchlist from first few for demo; in production, fetch from /api/watchlist/:userId
                setWatchlist(
                    allMovies.slice(0, 6).map((m: any) => ({
                        movieId: m.movieId,
                        title: m.title,
                        genre: m.genre,
                        poster: `/api/ai/poster/${m.movieId}`,
                    }))
                );
            } catch { }
            setLoading(false);
        }
        load();
    }, []);

    const handleRemove = async (movieId: number) => {
        // Note: Watchlist functionality requires custom backend implementation alongside Clerk
        setWatchlist((prev) => prev.filter((m) => m.movieId !== movieId));
    };

    const sortedList = [...watchlist].sort((a, b) => {
        if (sortBy === "genre") return a.genre.localeCompare(b.genre);
        if (sortBy === "title") return a.title.localeCompare(b.title);
        return 0; // recent = default order
    });

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="pt-24 px-6 md:px-12 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black">My Watchlist</h1>
                    <div className="flex gap-2">
                        {(["recent", "genre", "title"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSortBy(s)}
                                className={`px-4 py-2 text-sm rounded-full transition ${sortBy === s
                                    ? "bg-[var(--accent)] text-white"
                                    : "bg-white/10 text-[var(--text-secondary)] hover:bg-white/20"
                                    }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-[2/3] shimmer rounded-xl" />
                        ))}
                    </div>
                ) : sortedList.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-[var(--text-secondary)] text-lg">Your watchlist is empty.</p>
                        <Link href="/" className="btn-primary inline-block mt-4">
                            Browse Movies
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        <AnimatePresence>
                            {sortedList.map((m) => (
                                <motion.div
                                    key={m.movieId}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative group rounded-xl overflow-hidden"
                                >
                                    <Link href={`/movie/${m.movieId}`}>
                                        <div className="aspect-[2/3] relative">
                                            <Image
                                                src={m.poster}
                                                alt={m.title}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <h3 className="text-sm font-semibold text-white line-clamp-2">{m.title.replace(/\(\d{4}\)/, "").trim()}</h3>
                                                <span className="text-xs text-[var(--text-secondary)]">{m.genre}</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => handleRemove(m.movieId)}
                                        className="absolute top-2 right-2 w-8 h-8 bg-red-600/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-sm"
                                    >
                                        ✕
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    );
}
