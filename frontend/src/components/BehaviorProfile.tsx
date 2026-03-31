"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchBehaviorProfile, type BehaviorProfile as BehaviorData } from "@/lib/api";

function CircularProgress({ value, size = 72, color = "#e50914" }: { value: number; size?: number; color?: string }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function BehaviorProfileCard({ userId = 1 }: { userId?: number }) {
    const [profile, setProfile] = useState<BehaviorData | null>(null);

    useEffect(() => {
        fetchBehaviorProfile(userId).then(setProfile).catch(() => { });
    }, [userId]);

    if (!profile) {
        return (
            <div className="glass-card p-6 mb-10 shimmer h-48 rounded-2xl" />
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8 mb-10 rounded-2xl"
        >
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🧠</span>
                <h2 className="text-xl font-bold">Your Watch Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Scores */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <CircularProgress value={profile.binge_score} color="#e50914" />
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                {profile.binge_score}
                            </span>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] mt-1">Binge</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <CircularProgress value={profile.diversity_score} color="#f5c518" />
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                {profile.diversity_score}
                            </span>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] mt-1">Diversity</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <CircularProgress value={profile.avg_completion} color="#22c55e" />
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                {Math.round(profile.avg_completion)}%
                            </span>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] mt-1">Completion</span>
                    </div>
                </div>

                {/* Behavior Tags */}
                <div>
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Behavior Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.behavior_tags.map((tag, i) => (
                            <motion.span
                                key={tag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-[var(--accent)]/30 to-purple-600/30 border border-[var(--accent)]/40 font-medium"
                            >
                                {tag}
                            </motion.span>
                        ))}
                    </div>
                    {/* Top Genres */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                        {profile.top_genres.slice(0, 4).map((g) => (
                            <span key={g} className="px-2 py-1 text-xs rounded bg-white/10 text-[var(--text-secondary)]">
                                {g}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Insights */}
                <div>
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">💡 AI Insights</h3>
                    <div className="space-y-2">
                        {profile.insights.slice(0, 3).map((insight, i) => (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.2 }}
                                className="text-xs text-[var(--text-secondary)] leading-relaxed pl-3 border-l-2 border-[var(--accent)]/50"
                            >
                                {insight}
                            </motion.p>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
