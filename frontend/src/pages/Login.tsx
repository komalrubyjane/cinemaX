import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { motion } from "framer-motion";

export function Component() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.status === "success" || data.token) {
        localStorage.setItem("token", data.token || "local-session");
        localStorage.setItem("userId", String(data.userId || "1"));
        localStorage.setItem("username", username);
        if (data.profiles) {
          localStorage.setItem("profiles", JSON.stringify(data.profiles));
        }
        navigate("/profiles");
      } else {
        setError(data.detail || "Invalid credentials.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername("admin");
    setPassword("1234");
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at top left, hsla(210,100%,98%,1) 0%, hsla(220,100%,95%,1) 100%)`,
        position: "relative",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <Box sx={{ position: "absolute", top: 30, left: 50 }}>
        <Typography
          variant="h4"
          sx={{ color: "#004de6", fontWeight: 900, letterSpacing: -1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          CINEMAX
        </Typography>
      </Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        sx={{
          width: "100%",
          maxWidth: 460,
          backgroundColor: "#ffffff",
          p: 8,
          borderRadius: 4,
          color: "#111827",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08)",
          border: '1px solid #f3f4f6'
        }}
      >
        <Typography variant="h4" mb={4} fontWeight="bold">
          Sign In
        </Typography>

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            placeholder="Username / Email"
            variant="filled"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              mb: 2,
              backgroundColor: "#f5f5f5",
              borderRadius: 1,
              input: { color: "#333" },
              "& .MuiFilledInput-root": { backgroundColor: "#f5f5f5" }
            }}
          />
          <TextField
            fullWidth
            type="password"
            placeholder="Password"
            variant="filled"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: 4,
              backgroundColor: "#f5f5f5",
              borderRadius: 1,
              input: { color: "#333" },
              "& .MuiFilledInput-root": { backgroundColor: "#f5f5f5" }
            }}
          />

          {error && (
            <Typography color="error" variant="body2" mb={2}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              p: 1.5,
              mb: 2,
              backgroundColor: "#004de6",
              "&:hover": { backgroundColor: "#003db3" },
              fontWeight: 700,
              fontSize: "1.1rem",
              color: 'white',
              borderRadius: '8px',
              textTransform: 'none'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={fillDemo}
            sx={{ color: "#004de6", borderColor: "rgba(0,77,230,0.3)", mb: 4, borderRadius: '8px', textTransform: 'none', "&:hover": { borderColor: "#004de6", color: "#004de6", bgcolor: 'rgba(0,77,230,0.02)' } }}
          >
            Use Demo Account (admin / 1234)
          </Button>
        </form>

        <Typography variant="body2" color="gray" sx={{ mt: 2 }}>
          New to CINEMAX?{" "}
          <span
            style={{ color: "#004de6", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/signup")}
          >
            Sign up now.
          </span>
        </Typography>
      </Box>
    </Box>
  );
}

Component.displayName = "LoginPage";
