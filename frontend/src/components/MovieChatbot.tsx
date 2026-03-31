import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/ArrowUpward";
import SmartToyIcon from "@mui/icons-material/SmartToy";

export default function MovieChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
        { role: "bot", content: "Hi! I'm your CINEMAX AI assistant. Ask me anything about movies, actors, or recommendations!" }
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
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <AnimatePresence>
                {isOpen && (
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        sx={{
                            backgroundColor: '#121212',
                            border: '1px solid #333',
                            borderRadius: '16px',
                            boxShadow: 24,
                            width: { xs: 320, sm: 380 },
                            height: 500,
                            overflow: 'hidden',
                            mb: 2,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ backgroundColor: '#E50914', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                🍿 CINEMAX AI
                            </Typography>
                            <IconButton size="small" sx={{ color: 'white' }} onClick={() => setIsOpen(false)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {/* Messages */}
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {messages.map((msg, i) => (
                                <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <Box sx={{
                                        maxWidth: '80%',
                                        px: 2, py: 1,
                                        borderRadius: '16px',
                                        borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                                        borderTopLeftRadius: msg.role === 'bot' ? '4px' : '16px',
                                        backgroundColor: msg.role === 'user' ? '#E50914' : '#2A2A2A',
                                        color: msg.role === 'user' ? 'white' : '#E0E0E0',
                                        fontSize: '0.875rem'
                                    }}>
                                        {msg.content}
                                    </Box>
                                </Box>
                            ))}
                            {loading && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <Box sx={{ backgroundColor: '#2A2A2A', color: '#AAA', borderRadius: '16px', borderTopLeftRadius: '4px', px: 2, py: 1, fontSize: '0.875rem' }}>
                                        ...
                                    </Box>
                                </Box>
                            )}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 1.5, borderTop: '1px solid #333', backgroundColor: '#121212', display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Ask about movies..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && handleSend()}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '24px',
                                        color: 'white',
                                        backgroundColor: '#2A2A2A',
                                        '& fieldset': { border: 'none' },
                                    }
                                }}
                            />
                            <IconButton 
                                onClick={handleSend} 
                                disabled={loading || !input.trim()}
                                sx={{ 
                                    backgroundColor: '#E50914', 
                                    color: 'white', 
                                    '&:hover': { backgroundColor: '#B81D24' },
                                    '&.Mui-disabled': { backgroundColor: '#555', color: '#888' }
                                }}
                            >
                                <SendIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </AnimatePresence>

            <IconButton
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    width: 56, height: 56,
                    backgroundColor: '#E50914',
                    color: 'white',
                    boxShadow: 4,
                    '&:hover': { backgroundColor: '#B81D24' }
                }}
            >
                {isOpen ? <CloseIcon /> : <SmartToyIcon />}
            </IconButton>
        </Box>
    );
}
