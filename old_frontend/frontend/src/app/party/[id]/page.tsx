"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

interface ChatMessage {
    type: "chat" | "system";
    sender?: string;
    text?: string;
    message?: string;
}

export default function WatchPartyPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const roomId = params.id as string;
    const movieId = searchParams.get("movie") || "1";

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [playbackStatus, setPlaybackStatus] = useState<"playing" | "paused">("paused");
    const [progress, setProgress] = useState(0);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const username = "User_" + Math.random().toString(36).substring(2, 6);

    useEffect(() => {
        const ws = new WebSocket(`ws://127.0.0.1:8000/api/party/ws/${roomId}?username=${username}`);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "chat") {
                setMessages((prev) => [...prev, { type: "chat", sender: data.sender, text: data.text }]);
            } else if (data.type === "system") {
                setMessages((prev) => [...prev, { type: "system", message: data.message }]);
                if (data.participants) setParticipants(data.participants);
                if (data.state) {
                    setPlaybackStatus(data.state.status);
                    setProgress(data.state.timestamp);
                }
            } else if (data.type === "sync") {
                setPlaybackStatus(data.status);
                setProgress(data.timestamp);
            }
        };

        return () => ws.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Simulate playback progress
    useEffect(() => {
        if (playbackStatus !== "playing") return;
        const interval = setInterval(() => {
            setProgress((p) => Math.min(p + 1, 100));
        }, 1000);
        return () => clearInterval(interval);
    }, [playbackStatus]);

    const sendChat = () => {
        if (!chatInput.trim() || !wsRef.current) return;
        wsRef.current.send(JSON.stringify({ action: "chat", text: chatInput }));
        setChatInput("");
    };

    const togglePlay = () => {
        const newStatus = playbackStatus === "playing" ? "paused" : "playing";
        wsRef.current?.send(
            JSON.stringify({ action: newStatus === "playing" ? "play" : "pause", status: newStatus, timestamp: progress })
        );
    };

    const seek = (value: number) => {
        setProgress(value);
        wsRef.current?.send(JSON.stringify({ action: "seek", status: playbackStatus, timestamp: value }));
    };

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="pt-20 px-4 md:px-8 pb-10 flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)]">
                {/* Video Player Area */}
                <div className="flex-1 flex flex-col">
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-card)] to-black flex items-center justify-center">
                            <span className="text-6xl animate-pulse">🎬</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={togglePlay}
                                    className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xl hover:scale-110 transition"
                                >
                                    {playbackStatus === "playing" ? "⏸" : "▶"}
                                </button>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={progress}
                                    onChange={(e) => seek(Number(e.target.value))}
                                    className="flex-1 h-1 accent-[var(--accent)]"
                                />
                                <span className="text-xs text-[var(--text-secondary)] font-mono">
                                    {Math.floor(progress / 60)}:{String(progress % 60).padStart(2, "0")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-sm font-semibold">{connected ? "Connected" : "Disconnected"}</span>
                            <span className="text-xs text-[var(--text-secondary)] ml-auto">Room: {roomId}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {participants.map((p) => (
                                <span key={p} className="px-3 py-1 text-xs rounded-full bg-white/10 border border-white/20">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar */}
                <div className="w-full lg:w-96 glass-card flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="font-bold text-lg">💬 Watch Party Chat</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={msg.type === "system" ? "text-center" : ""}
                                >
                                    {msg.type === "system" ? (
                                        <span className="text-xs text-[var(--text-secondary)] italic">{msg.message}</span>
                                    ) : (
                                        <div className="bg-white/5 rounded-xl px-3 py-2">
                                            <span className="text-xs font-semibold text-[var(--accent)]">{msg.sender}</span>
                                            <p className="text-sm text-white">{msg.text}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/10 flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendChat()}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                        <button onClick={sendChat} className="btn-primary !py-2 !px-4 !rounded-full">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
