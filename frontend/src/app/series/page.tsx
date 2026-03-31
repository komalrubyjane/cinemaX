"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState, useRef } from "react";
import { fetchMovies, posterUrl, type MovieSummary } from "@/lib/api";
import Link from "next/link";

function SeriesCategoryRow({ title, movies }: { title: string, movies: MovieSummary[] }) {
    const rowRef = useRef<HTMLDivElement>(null);
    if (!movies || movies.length === 0) return null;

    const scroll = (dir: "left" | "right") => {
        if (rowRef.current) {
            rowRef.current.scrollBy({ left: dir === "right" ? window.innerWidth * 0.75 : -(window.innerWidth * 0.75), behavior: "smooth" });
        }
    };

    return (
        <div className="relative group mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-[#e5e5e5] mb-2 px-12">{title.replace('Movies', 'Series')}</h2>
            
            <button 
                onClick={() => scroll("left")}
                className="absolute left-0 top-10 bottom-[2vw] z-40 w-[4vw] bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center hover:bg-black/70 rounded-r-md"
            >
                <svg className="w-8 h-8 text-white scale-y-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>

            <button 
                onClick={() => scroll("right")}
                className="absolute right-0 top-10 bottom-[2vw] z-40 w-[4vw] bg-black/50 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center hover:bg-black/70 rounded-l-md"
            >
                <svg className="w-8 h-8 text-white scale-y-150" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
            
            <div className="flex gap-[0.4vw] overflow-x-auto overflow-y-hidden scroll-smooth snap-x no-scrollbar pb-[4vw] pt-[2vw] -mt-[2vw] px-12" ref={rowRef}>
                {movies.map((m, i) => (
                    <div 
                        key={`${m.movieId}-${i}`} 
                        className="flex-none w-[40vw] sm:w-[25vw] md:w-[20vw] lg:w-[15vw] xl:w-[14vw] aspect-[2/3] relative rounded-md group/card cursor-pointer snap-start"
                    >
                        <Link href={`/movie/${m.movieId}`} className="absolute inset-0 z-10 block transition-all duration-300 origin-bottom hover:scale-[1.3] hover:z-50 hover:shadow-2xl hover:shadow-black delay-75 ease-out rounded-md">
                            <img 
                                src={posterUrl(m.movieId)} 
                                alt={m.title} 
                                className="w-full h-full object-cover rounded-md"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 rounded-md bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-3">
                                <h3 className="text-white text-[0.8rem] font-bold line-clamp-1">{m.title}</h3>
                                <div className="text-[0.6rem] font-bold text-green-500 mt-1">New Episodes</div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SeriesPage() {
    const [feed, setFeed] = useState<Record<string, MovieSummary[]>>({});

    useEffect(() => {
        async function load() {
            try {
                const userId = localStorage.getItem("userId") || undefined;
                const data = await fetchMovies(userId);
                
                // For series, shuffle the keys to make it distinct from movies view
                const shuffledKeys = Object.keys(data).sort(() => 0.5 - Math.random());
                const newData: Record<string, MovieSummary[]> = {};
                for (const k of shuffledKeys) {
                    newData[k] = data[k];
                }
                setFeed(newData);
            } catch (err) {
                console.error(err);
            }
        }
        load();
    }, []);

    return (
        <main className="min-h-screen bg-[#141414] overflow-hidden">
            <Navbar />
            <div className="pt-24 pb-12">
                <div className="px-12 mb-8 flex items-center gap-12">
                    <h1 className="text-4xl font-bold text-white">TV Series</h1>
                    <div className="hidden md:flex items-center gap-4 bg-black/60 border border-white/20 py-1 px-4 text-white text-sm">
                        <span className="font-bold opacity-70">Genres</span>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>
                    </div>
                </div>
                
                {Object.entries(feed).map(([categoryName, moviesList]) => (
                    <SeriesCategoryRow key={categoryName} title={categoryName} movies={moviesList} />
                ))}
            </div>
        </main>
    );
}
