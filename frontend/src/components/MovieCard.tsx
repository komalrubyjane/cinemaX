"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { posterUrl } from "@/lib/api";

interface MovieCardProps {
    movieId: number;
    title: string;
    genre: string;
    poster?: string;
    rating?: string;
    progress?: number;
    year?: number;
    inWatchlist?: boolean;
    userId?: number;
    onWatchlistChange?: () => void;
}

export default function MovieCard({
    movieId,
    title,
    genre,
    poster,
    rating,
    progress,
    year,
    inWatchlist = false,
    userId = 1,
    onWatchlistChange,
}: MovieCardProps) {
    const [added, setAdded] = useState(inWatchlist);
    const [imgError, setImgError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const handleAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!added) {
            // Note: Watchlist functionality requires custom backend implementation alongside Clerk
            setAdded(true);
            onWatchlistChange?.();
        }
    };

    // Extract year from title if not provided
    const displayYear = year || (() => {
        const m = title.match(/\((\d{4})\)/);
        return m ? m[1] : "";
    })();

    const cleanTitle = title.replace(/\(\d{4}\)/, "").trim();

    return (
        <Link href={`/movie/${movieId}`}>
            <motion.div
                className="relative flex-shrink-0 w-[180px] md:w-[220px] rounded-xl overflow-hidden cursor-pointer group"
                whileHover={{ scale: 1.08, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {/* Poster Image */}
                <div className="relative aspect-[2/3] bg-[var(--bg-card)]">
                    {!isLoaded && (
                        <div className="absolute inset-0 shimmer rounded-xl" />
                    )}
                    <Image
                        src={imgError ? "https://placehold.co/400x600/1a1a2e/ffffff?text=No+Poster" : (poster || posterUrl(movieId))}
                        alt={cleanTitle}
                        fill
                        className={`object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                        sizes="220px"
                        onLoad={() => setIsLoaded(true)}
                        onError={() => { setImgError(true); setIsLoaded(true); }}
                        unoptimized
                    />

                    {/* Hover Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
                    >
                        {/* Rating Badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[var(--gold)] text-sm font-bold">★ {rating || "8.5"}</span>
                            {displayYear && (
                                <span className="text-[var(--text-secondary)] text-xs">{displayYear}</span>
                            )}
                        </div>

                        <h3 className="text-white text-sm font-semibold leading-tight mb-1 line-clamp-2">
                            {cleanTitle}
                        </h3>

                        <span className="text-[var(--text-secondary)] text-xs mb-3">{genre}</span>

                        {/* Quick Add Button */}
                        <motion.button
                            onClick={handleAdd}
                            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${added
                                ? "bg-green-600/80 text-white"
                                : "bg-white/20 backdrop-blur-sm text-white hover:bg-[var(--accent)]"
                                }`}
                            whileTap={{ scale: 0.95 }}
                        >
                            {added ? "✓ Added" : "+ Watchlist"}
                        </motion.button>
                    </motion.div>
                    {/* Continue Watching Progress Overlay */}
                    {progress !== undefined && progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700/80">
                            <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}
