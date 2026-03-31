"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchMovies, type MovieSummary } from "@/lib/api";

type ViewMode = "full" | "family" | "kids";

interface NavbarProps {
    mode?: ViewMode;
    onModeChange?: (mode: ViewMode) => void;
}

export default function Navbar({ mode = "full", onModeChange }: NavbarProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<MovieSummary[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length > 1) {
            const data = await searchMovies(val);
            setResults(data);
        } else {
            setResults([]);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "bg-[#0a0a0f]/95 border-b border-white/5 backdrop-blur-md" : "bg-gradient-to-b from-black/80 to-transparent"
        }`}>
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-12">
                <Link href="/" className="flex items-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-3xl font-black text-[#e50914] tracking-wider"
                        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                    >
                        CinemaX
                    </motion.span>
                </Link>

                {/* Center Navigation Links (Hidden on mobile via generic CSS or just flex) */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/" className="relative text-sm font-medium text-white transition hover:text-white/80 group">
                        Home
                        <motion.span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#e50914] rounded-full"></motion.span>
                    </Link>
                    <Link href="/movies" className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-white">
                        Movies
                    </Link>
                    <Link href="/series" className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-white">
                        Series
                    </Link>
                    <Link href="/watchlist" className="text-sm font-medium text-[var(--text-secondary)] transition hover:text-white flex items-center gap-1 cursor-pointer">
                        My list
                    </Link>
                </div>
            </div>

            {/* Right: Icons & Controls */}
            <div className="flex items-center gap-6">
                {/* Search Toggle */}
                <div className="relative flex items-center">
                    <AnimatePresence>
                        {showSearch && (
                            <motion.input
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 200, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                type="text"
                                placeholder="Titles, people, genres"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="absolute right-8 bg-black/60 border border-white/20 text-white text-sm px-3 py-1 outline-none focus:bg-black/80 transition-all z-10"
                            />
                        )}
                    </AnimatePresence>
                    <button onClick={() => setShowSearch(!showSearch)} className="w-5 h-5 text-white cursor-pointer z-20">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    {/* Search Results Dropdown */}
                    {showSearch && results.length > 0 && query.length > 1 && (
                        <div className="absolute top-10 right-0 w-64 bg-black/90 border border-white/10 p-2 max-h-80 overflow-y-auto z-30">
                            {results.slice(0, 5).map((m) => (
                                <Link key={m.movieId} href={`/movie/${m.movieId}`} className="flex items-center gap-3 p-2 hover:bg-white/10 transition">
                                    <span className="text-sm text-white truncate">{m.title}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notifications Bell */}
                <button className="w-5 h-5 text-white">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>

                {/* User Avatar with Dropdown */}
                <div className="relative group cursor-pointer py-4">
                    <div className="w-8 h-8 rounded-[4px] border border-white/20 overflow-hidden">
                        <img src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/366be133850498.56ba69ac36858.png" alt="User Profile" className="w-full h-full object-cover" />
                    </div>
                    {/* Hover Dropdown Menu */}
                    <div className="absolute right-0 top-full -mt-2 w-48 bg-black/90 border border-white/10 rounded-md py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl z-50">
                        <div className="px-4 py-2 text-sm text-white hover:underline cursor-pointer transition">Account Settings</div>
                        <div className="px-4 py-2 text-sm text-white hover:underline cursor-pointer transition">Help Center</div>
                        <div className="border-t border-white/10 my-2"></div>
                        <div 
                            className="px-4 py-2 text-sm text-white hover:underline cursor-pointer transition font-bold"
                            onClick={() => { localStorage.clear(); window.location.href='/login'; }}
                        >
                            Sign out of CinemaX
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
