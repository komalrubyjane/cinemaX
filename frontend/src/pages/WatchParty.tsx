import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import GroupIcon from "@mui/icons-material/Group";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  type: "chat" | "system";
  sender?: string;
  text?: string;
  message?: string;
}

export function Component() {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [playbackStatus, setPlaybackStatus] = useState<"playing" | "paused">("paused");
  const [progress, setProgress] = useState(0);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem("username")?.split("@")[0] || "User_" + Math.random().toString(36).substring(2, 6);
  const partyLink = `${window.location.origin}/party/${roomId}`;

  useEffect(() => {
    // Add welcome system message immediately
    setMessages([
      {
        type: "system",
        message: `Welcome to Watch Party room "${roomId}"! Share the link to invite friends.`,
      },
    ]);

    // Try to connect WebSocket (gracefully handle failure)
    try {
      const wsUrl = `ws://127.0.0.1:8000/api/party/ws/${roomId}?username=${encodeURIComponent(username)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setMessages((prev) => [
          ...prev,
          { type: "system", message: `${username} joined the party 🎉` },
        ]);
      };

      ws.onclose = () => setConnected(false);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "chat") {
          setMessages((prev) => [
            ...prev,
            { type: "chat", sender: data.sender, text: data.text },
          ]);
        } else if (data.type === "system") {
          setMessages((prev) => [
            ...prev,
            { type: "system", message: data.message },
          ]);
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
    } catch {
      // WebSocket unavailable — run in demo mode
    }
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (playbackStatus !== "playing") return;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [playbackStatus]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "chat", text: msg }));
    } else {
      // Demo mode — show locally
      setMessages((prev) => [
        ...prev,
        { type: "chat", sender: username, text: msg },
      ]);
    }
  };

  const togglePlay = () => {
    const newStatus = playbackStatus === "playing" ? "paused" : "playing";
    setPlaybackStatus(newStatus);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: newStatus === "playing" ? "play" : "pause", status: newStatus, timestamp: progress })
      );
    }
    setMessages((prev) => [
      ...prev,
      {
        type: "system",
        message: `${username} ${newStatus === "playing" ? "▶ resumed" : "⏸ paused"} playback`,
      },
    ]);
  };

  const seek = (value: number) => {
    setProgress(value);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "seek", status: playbackStatus, timestamp: value }));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(partyLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Box
      sx={{
        pt: 10,
        px: { xs: 2, sm: 4, md: 6 },
        pb: 4,
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        gap: 3,
      }}
    >
      {/* Left: Video + Controls */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate("/browse")} sx={{ color: "white" }}>
            <KeyboardBackspaceIcon />
          </IconButton>
          <GroupIcon sx={{ color: "#E50914" }} />
          <Typography variant="h6" fontWeight="bold">
            Watch Party
          </Typography>
          <Chip
            label={`Room: ${roomId}`}
            variant="outlined"
            size="small"
            sx={{ color: "grey.400", borderColor: "grey.700" }}
          />
        </Stack>

        {/* Share Link */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(229,9,20,0.08)",
            border: "1px solid rgba(229,9,20,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" sx={{ color: "grey.400", flex: 1, wordBreak: "break-all" }}>
            🔗 {partyLink}
          </Typography>
          <Button
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={copyLink}
            variant="contained"
            sx={{ bgcolor: copied ? "#4caf50" : "#E50914", "&:hover": { bgcolor: copied ? "#388e3c" : "#B81D24" }, minWidth: 100 }}
          >
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </Box>

        {/* Video Area */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "16/9",
            bgcolor: "#0a0a0a",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: "grey.600",
            }}
          >
            <Typography sx={{ fontSize: "5rem" }}>🎬</Typography>
            <Typography variant="body1" color="grey.500">
              Synchronized playback powered by CINEMAX
            </Typography>
            <Typography variant="caption" color="grey.700">
              All participants see the same frame at the same time
            </Typography>
          </Box>

          {/* Playback controls overlay */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={togglePlay}
                sx={{
                  bgcolor: "#E50914",
                  color: "white",
                  "&:hover": { bgcolor: "#B81D24" },
                  width: 44,
                  height: 44,
                }}
              >
                {playbackStatus === "playing" ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <input
                type="range"
                min={0}
                max={180}
                value={progress}
                onChange={(e) => seek(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#E50914", cursor: "pointer" }}
              />
              <Typography
                variant="caption"
                sx={{ fontFamily: "monospace", color: "white", minWidth: 60 }}
              >
                {formatTime(progress)} / 3:00
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* Room Status */}
        <Box
          sx={{
            p: 2,
            bgcolor: "rgba(255,255,255,0.03)",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: connected ? "#4caf50" : "#ff9800",
                boxShadow: connected ? "0 0 6px #4caf50" : "0 0 6px #ff9800",
              }}
            />
            <Typography variant="body2" fontWeight="bold" color={connected ? "#4caf50" : "#ff9800"}>
              {connected ? "Live • Synced" : "Demo Mode (backend offline)"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label={`👤 ${username}`}
              size="small"
              sx={{ bgcolor: "rgba(229,9,20,0.2)", color: "white", borderColor: "rgba(229,9,20,0.4)", border: "1px solid" }}
            />
            {participants.filter((p) => p !== username).map((p) => (
              <Chip
                key={p}
                label={`👤 ${p}`}
                size="small"
                variant="outlined"
                sx={{ color: "grey.400" }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Right: Chat Sidebar */}
      <Box
        sx={{
          width: { xs: "100%", lg: 360 },
          display: "flex",
          flexDirection: "column",
          bgcolor: "rgba(255,255,255,0.03)",
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
          minHeight: { xs: 300, lg: "auto" },
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(135deg, rgba(229,9,20,0.15), rgba(0,0,0,0))",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            💬 Party Chat
          </Typography>
          <Typography variant="caption" color="grey.600">
            Chat syncs with everyone in the room
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            maxHeight: { xs: 300, lg: "calc(100vh - 320px)" },
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(229,9,20,0.4)", borderRadius: 2 },
          }}
        >
          <AnimatePresence>
            {messages.map((msg, i) => (
              <Box
                component={motion.div}
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                sx={{ textAlign: msg.type === "system" ? "center" : "left" }}
              >
                {msg.type === "system" ? (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "grey.600",
                      fontStyle: "italic",
                      display: "block",
                      py: 0.5,
                    }}
                  >
                    {msg.message}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      bgcolor:
                        msg.sender === username
                          ? "rgba(229,9,20,0.15)"
                          : "rgba(255,255,255,0.05)",
                      p: 1.5,
                      borderRadius: 2,
                      borderTopLeftRadius: msg.sender === username ? 8 : 2,
                      borderTopRightRadius: msg.sender === username ? 2 : 8,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: msg.sender === username ? "#E50914" : "#90caf9",
                        fontWeight: "bold",
                        display: "block",
                        mb: 0.3,
                      }}
                    >
                      {msg.sender === username ? "You" : msg.sender}
                    </Typography>
                    <Typography variant="body2">{msg.text}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </Box>

        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                bgcolor: "rgba(255,255,255,0.05)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                "&:hover fieldset": { borderColor: "rgba(229,9,20,0.4)" },
                "&.Mui-focused fieldset": { borderColor: "#E50914" },
              },
            }}
          />
          <Button
            variant="contained"
            onClick={sendChat}
            disabled={!chatInput.trim()}
            sx={{ bgcolor: "#E50914", "&:hover": { bgcolor: "#B81D24" }, minWidth: 60 }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

Component.displayName = "WatchPartyPage";
