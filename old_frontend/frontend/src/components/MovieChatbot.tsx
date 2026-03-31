"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MovieChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
        { role: "bot", content: "Hi! I'm your CineMatch AI assistant. Ask me anything about movies, actors, or recommendations!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userQuery = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userQuery }]);
        setLoading(true);

        try {
            // Call our Python FastAPI AI engine chatbot route
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: userQuery })
            });
            const data = await res.json();

            setMessages(prev => [...prev, {
                role: "bot",
                content: res.ok ? data.reply : "Sorry, I'm having trouble connecting to my movie database."
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: "bot", content: "Network error. Please try again later." }]);
        }
        setLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden mb-4 flex flex-col h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-red-600 px-4 py-3 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <span>🍿</span> CineMatch AI
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-red-700 p-1 rounded transition">
                                ✕
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === "user"
                                            ? "bg-red-600 text-white rounded-tr-sm"
                                            : "bg-zinc-800 text-zinc-200 rounded-tl-sm"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-800 text-zinc-400 rounded-2xl rounded-tl-sm px-4 py-2 text-sm flex gap-1">
                                        <span className="animate-bounce">.</span>
                                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                                        <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Ask about movies..."
                                    className="flex-1 bg-zinc-800 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-red-600 text-white"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-700 disabled:opacity-50 transition"
                                >
                                    ↑
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-red-600 text-white rounded-full shadow-xl flex items-center justify-center text-2xl"
            >
                {isOpen ? "✕" : "🤖"}
            </motion.button>
        </div>
    );
}
