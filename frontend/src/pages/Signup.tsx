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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && (data.status === "success" || data.status === "user_created" || data.token)) {
        navigate("/login");
      } else {
        setError(data.detail || "Error creating account.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('https://assets.nflxext.com/ffe/siteui/vlv3/fc164b4b-f085-44ee-bb7f-ec7df8539571/d3b4e127-4bf6-4c5f-a5ba-fe27fcbeb2fb/IN-en-20240226-popsignuptwoithreads-perspective_alpha_website_small.jpg')`,
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        sx={{
          width: "100%",
          maxWidth: 450,
          backgroundColor: "rgba(0,0,0,0.75)",
          p: 6,
          borderRadius: 2,
          color: "black"
        }}
      >
        <Typography variant="h4" mb={4} fontWeight="bold">
          Sign Up
        </Typography>

        <form onSubmit={handleSignup}>
          <TextField
            fullWidth
            placeholder="Username"
            variant="filled"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              mb: 2,
              backgroundColor: "#333",
              borderRadius: 1,
              input: { color: "black" },
              "& .MuiFilledInput-root": { backgroundColor: "#333" }
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
              mb: 2,
              backgroundColor: "#333",
              borderRadius: 1,
              input: { color: "black" },
              "& .MuiFilledInput-root": { backgroundColor: "#333" }
            }}
          />
          <TextField
            fullWidth
            type="password"
            placeholder="Confirm Password"
            variant="filled"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{
              mb: 4,
              backgroundColor: "#333",
              borderRadius: 1,
              input: { color: "black" },
              "& .MuiFilledInput-root": { backgroundColor: "#333" }
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
              mb: 4,
              backgroundColor: "#87CEEB",
              "&:hover": { backgroundColor: "#0284c7" },
              fontWeight: 700,
              fontSize: "1rem"
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
          </Button>
        </form>

        <Typography variant="body2" color="gray">
          Already have an account?{" "}
          <span
            style={{ color: "black", cursor: "pointer", fontWeight: "bold" }}
            onClick={() => navigate("/login")}
          >
            Sign in now.
          </span>
        </Typography>
      </Box>
    </Box>
  );
}

Component.displayName = "SignupPage";
