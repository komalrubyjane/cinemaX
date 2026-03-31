"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const MOODS = [
    { id: "happy", emoji: "😊", label: "Happy", color: "from-yellow-400 to-amber-500", bg: "bg-amber-500/20" },
    { id: "sad", emoji: "😢", label: "Emotional", color: "from-blue-400 to-indigo-500", bg: "bg-blue-500/20" },
    { id: "thrilled", emoji: "🔥", label: "Thrilled", color: "from-red-500 to-orange-500", bg: "bg-red-500/20" },
    { id: "relaxed", emoji: "😌", label: "Relaxed", color: "from-green-400 to-emerald-500", bg: "bg-green-500/20" },
    { id: "romantic", emoji: "💕", label: "Romantic", color: "from-pink-400 to-rose-500", bg: "bg-pink-500/20" },
    { id: "scared", emoji: "😱", label: "Scared", color: "from-purple-500 to-violet-600", bg: "bg-purple-500/20" },
    { id: "inspired", emoji: "✨", label: "Inspired", color: "from-cyan-400 to-blue-500", bg: "bg-cyan-500/20" },
    { id: "nostalgic", emoji: "🌈", label: "Nostalgic", color: "from-orange-300 to-pink-400", bg: "bg-orange-500/20" },
];

interface MoodSelectorProps {
    activeMood: string | null;
    onMoodSelect: (mood: string | null) => void;
}

export default function MoodSelector({ activeMood, onMoodSelect }: MoodSelectorProps) {
    return (
        <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🎭</span>
                <h2 className="text-xl md:text-2xl font-bold">How are you feeling?</h2>
                {activeMood && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => onMoodSelect(null)}
                        className="ml-auto text-sm text-[var(--text-secondary)] hover:text-white px-3 py-1 rounded-full bg-white/10 transition"
                    >
                        ✕ Clear mood
                    </motion.button>
                )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
                {MOODS.map((mood, i) => {
                    const isActive = activeMood === mood.id;
                    return (
                        <motion.button
                            key={mood.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => onMoodSelect(isActive ? null : mood.id)}
                            className={`flex-shrink-0 flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border transition-all cursor-pointer ${isActive
                                    ? `${mood.bg} border-white/30 shadow-lg shadow-white/5`
                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                }`}
                            whileHover={{ scale: 1.08, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <motion.span
                                className="text-3xl"
                                animate={isActive ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.5 }}
                            >
                                {mood.emoji}
                            </motion.span>
                            <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-[var(--text-secondary)]"}`}>
                                {mood.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="mood-indicator"
                                    className={`h-1 w-8 rounded-full bg-gradient-to-r ${mood.color}`}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}
