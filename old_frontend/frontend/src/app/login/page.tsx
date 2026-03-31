"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loginLocal, syncLocalUser } from "@/lib/api";

// Cinematic movie posters for background collage
const BG_POSTERS = [
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
    "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
];

type Step = "idle" | "connecting" | "authenticating" | "success" | "error";

const STEP_MESSAGES: Record<Step, string> = {
    idle: "",
    connecting: "🔗 Connecting to CinemaX...",
    authenticating: "🔐 Authenticating credentials...",
    success: "✅ Welcome back! Redirecting...",
    error: "",
};

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState<Step>("idle");
    const [error, setError] = useState("");
    const [touched, setTouched] = useState({ username: false, password: false });

    const usernameError = touched.username && !username.trim() ? "Username is required" : "";
    const passwordError = touched.password && password.length < 4 ? "Password must be at least 4 characters" : "";
    const canSubmit = username.trim().length > 0 && password.length >= 4 && step !== "authenticating" && step !== "success";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ username: true, password: true });
        if (!canSubmit) return;

        setError("");
        setStep("connecting");

        await new Promise(r => setTimeout(r, 600));
        setStep("authenticating");

        try {
            const res = await loginLocal({ username: username.trim(), password });

            if (res.status === "success") {
                localStorage.setItem("token", res.token);
                localStorage.setItem("userId", String(res.userId));
                setStep("success");
                syncLocalUser(res.token).catch(() => {});
                setTimeout(() => { router.push("/"); router.refresh(); }, 1400);
            } else {
                setStep("error");
                setError(res.detail || "Invalid username or password. Please try again.");
            }
        } catch {
            setStep("error");
            setError("Network error — please check your connection and try again.");
        }
    };

    const fillDemo = () => {
        setUsername("admin");
        setPassword("1234");
        setTouched({ username: false, password: false });
        setError("");
        setStep("idle");
    };

    return (
        <div className="auth-root">
            {/* Background Poster Collage */}
            <div className="auth-bg-collage" aria-hidden="true">
                {BG_POSTERS.map((src, i) => (
                    <div
                        key={i}
                        className="auth-bg-poster"
                        style={{
                            backgroundImage: `url(${src})`,
                            animationDelay: `${i * 0.8}s`,
                            left: `${(i % 5) * 20}%`,
                            top: i < 5 ? "0%" : "50%",
                        }}
                    />
                ))}
                <div className="auth-bg-overlay" />
            </div>

            {/* Split Layout */}
            <div className="auth-container">
                {/* Left: Branding */}
                <motion.div
                    className="auth-brand-panel"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="auth-brand-logo">🎬</div>
                    <h1 className="auth-brand-title">CinemaX</h1>
                    <p className="auth-brand-tagline">AI-Powered Movie Streaming</p>
                    <ul className="auth-brand-features">
                        <li>🤖 Personalized AI Recommendations</li>
                        <li>🎭 HD Movie Posters & Trailers</li>
                        <li>🎉 Watch Parties with Friends</li>
                        <li>📋 Smart Watchlist & More</li>
                    </ul>
                </motion.div>

                {/* Right: Form */}
                <motion.div
                    className="auth-form-panel"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="auth-form-card">
                        <h2 className="auth-form-title">Sign In</h2>
                        <p className="auth-form-subtitle">Welcome back to CinemaX</p>

                        {/* Step Progress Indicator */}
                        <AnimatePresence mode="wait">
                            {step !== "idle" && step !== "error" && (
                                <motion.div
                                    key={step}
                                    className={`auth-step-indicator ${step === "success" ? "auth-step-success" : "auth-step-loading"}`}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {step !== "success" && <span className="auth-spinner" />}
                                    {STEP_MESSAGES[step]}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleLogin} className="auth-form" noValidate>
                            {/* Username */}
                            <div className="auth-field">
                                <label htmlFor="login-username" className="auth-label">Username</label>
                                <input
                                    id="login-username"
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    onBlur={() => setTouched(t => ({ ...t, username: true }))}
                                    className={`auth-input ${usernameError ? "auth-input-error" : username ? "auth-input-valid" : ""}`}
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                    disabled={step === "authenticating" || step === "success"}
                                />
                                {usernameError && (
                                    <motion.span className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        ⚠ {usernameError}
                                    </motion.span>
                                )}
                            </div>

                            {/* Password */}
                            <div className="auth-field">
                                <label htmlFor="login-password" className="auth-label">Password</label>
                                <div className="auth-input-wrapper">
                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onBlur={() => setTouched(t => ({ ...t, password: true }))}
                                        className={`auth-input auth-input-pw ${passwordError ? "auth-input-error" : password.length >= 4 ? "auth-input-valid" : ""}`}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        disabled={step === "authenticating" || step === "success"}
                                    />
                                    <button
                                        type="button"
                                        className="auth-pw-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                                {passwordError && (
                                    <motion.span className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        ⚠ {passwordError}
                                    </motion.span>
                                )}
                            </div>

                            {/* API Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        className="auth-error-box"
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        ❌ {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                id="login-submit-btn"
                                type="submit"
                                disabled={!canSubmit}
                                className="auth-btn-primary"
                            >
                                {step === "connecting" || step === "authenticating"
                                    ? <span className="auth-btn-loading"><span className="auth-spinner-sm" /> Signing in...</span>
                                    : step === "success"
                                        ? "✅ Signed in!"
                                        : "Sign In →"}
                            </button>

                            {/* Demo credentials */}
                            <button
                                type="button"
                                id="login-demo-btn"
                                onClick={fillDemo}
                                className="auth-btn-demo"
                            >
                                🎬 Use Demo Account (admin / 1234)
                            </button>
                        </form>

                        <p className="auth-switch-text">
                            New to CinemaX?{" "}
                            <a href="/signup" className="auth-switch-link">Create a free account →</a>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
