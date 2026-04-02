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
        background: `linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.6)), url('https://assets.nflxext.com/ffe/siteui/vlv3/fc164b4b-f085-44ee-bb7f-ec7df8539571/d3b4e127-4bf6-4c5f-a5ba-fe27fcbeb2fb/IN-en-20240226-popsignuptwoithreads-perspective_alpha_website_small.jpg')`,
        backgroundSize: "cover",
        position: "relative"
      }}
    >
      <Box sx={{ position: "absolute", top: 20, left: 40 }}>
        <Typography
          variant="h4"
          sx={{ color: "#87CEEB", fontWeight: 900, letterSpacing: 2, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          CINEMAX
        </Typography>
      </Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          width: "100%",
          maxWidth: 450,
          backgroundColor: "#fff",
          p: 6,
          borderRadius: 2,
          color: "#333",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
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
              backgroundColor: "#0071eb",
              "&:hover": { backgroundColor: "#005bb5" },
              fontWeight: 700,
              fontSize: "1rem",
              color: 'white'
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={fillDemo}
            sx={{ color: "#0071eb", borderColor: "rgba(0,113,235,0.4)", mb: 4, "&:hover": { borderColor: "#0071eb", color: "#0071eb" } }}
          >
            Use Demo Account (admin / 1234)
          </Button>
        </form>

        <Typography variant="body2" color="gray" sx={{ mt: 2 }}>
          New to CINEMAX?{" "}
          <span
            style={{ color: "#0071eb", cursor: "pointer", fontWeight: "bold" }}
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
