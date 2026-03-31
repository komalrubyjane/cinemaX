"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signupLocal, syncLocalUser } from "@/lib/api";

const BG_POSTERS = [
    "https://image.tmdb.org/t/p/w500/lD8dFIk9wDEvOwZw0BK47k3BMf9.jpg",
    "https://image.tmdb.org/t/p/w500/6EdQbPa1pLpd1g57vDx1MDo4TcE.jpg",
    "https://image.tmdb.org/t/p/w500/4Cb0R48TKc4oFYJTMiSQq7nKKHJ.jpg",
    "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    "https://image.tmdb.org/t/p/w500/vZ2hH2kiEJamTl3n6gU0Lg0a9BT.jpg",
    "https://image.tmdb.org/t/p/w500/Ab8vHSUUssO2TBRqKKqxJ5Hj8n2.jpg",
    "https://image.tmdb.org/t/p/w500/btTdmkgIvOi0FFip1sPuZI2oQG6.jpg",
];

const ALL_GENRES = ["Action", "Comedy", "Drama", "Horror", "Romance", "Thriller", "Sci-Fi", "Animation", "Adventure", "Documentary"];

function getPasswordStrength(pw: string): { label: string; score: number; color: string } {
    if (!pw) return { label: "", score: 0, color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", score: 1, color: "#ef4444" };
    if (score <= 3) return { label: "Fair", score: 2, color: "#f59e0b" };
    return { label: "Strong", score: 3, color: "#22c55e" };
}

type Step = "account" | "preferences" | "creating" | "success";

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("account");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [age, setAge] = useState("18");
    const [error, setError] = useState("");
    const [touched, setTouched] = useState({ username: false, email: false, password: false, confirm: false });

    const pwStrength = getPasswordStrength(password);
    const usernameError = touched.username && username.trim().length < 3 ? "Username must be at least 3 characters" : "";
    const emailError = touched.email && !/\S+@\S+\.\S+/.test(email) ? "Enter a valid email address" : "";
    const passwordError = touched.password && password.length < 6 ? "Password must be at least 6 characters" : "";
    const confirmError = touched.confirm && password !== confirmPassword ? "Passwords do not match" : "";

    const canProceed = !usernameError && !emailError && !passwordError && !confirmError
        && username.trim().length >= 3 && email.includes("@") && password.length >= 6 && password === confirmPassword;

    const toggleGenre = (g: string) => {
        setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    };

    const handleSignup = async () => {
        if (selectedGenres.length < 1) { setError("Please select at least 1 genre."); return; }
        setError("");
        setStep("creating");

        try {
            const res = await signupLocal({
                username: username.trim(),
                email,
                password,
                age: parseInt(age) || 18,
                preferred_genres: selectedGenres.join(","),
            });

            if (res.status === "success") {
                localStorage.setItem("token", res.token);
                localStorage.setItem("userId", String(res.userId));
                setStep("success");
                syncLocalUser(res.token).catch(() => {});
                setTimeout(() => { router.push("/"); router.refresh(); }, 1800);
            } else {
                setStep("preferences");
                setError(res.detail || "Signup failed. Username or email may already exist.");
            }
        } catch {
            setStep("preferences");
            setError("Network error — please check your connection and retry.");
        }
    };

    return (
        <div className="auth-root">
            {/* Background Poster Collage */}
            <div className="auth-bg-collage" aria-hidden="true">
                {BG_POSTERS.map((src, i) => (
                    <div key={i} className="auth-bg-poster"
                        style={{ backgroundImage: `url(${src})`, animationDelay: `${i * 0.7}s`, left: `${(i % 5) * 20}%`, top: i < 5 ? "0%" : "50%" }}
                    />
                ))}
                <div className="auth-bg-overlay" />
            </div>

            <div className="auth-container">
                {/* Left: Branding */}
                <motion.div className="auth-brand-panel" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
                    <div className="auth-brand-logo">🎬</div>
                    <h1 className="auth-brand-title">Join CinemaX</h1>
                    <p className="auth-brand-tagline">Create your free account in seconds</p>

                    {/* Progress Steps */}
                    <div className="signup-steps">
                        {[
                            { key: "account", label: "Account", icon: "👤" },
                            { key: "preferences", label: "Preferences", icon: "🎭" },
                            { key: "creating", label: "Creating", icon: "✨" },
                        ].map((s, i) => {
                            const stepOrder = ["account", "preferences", "creating", "success"];
                            const currentIdx = stepOrder.indexOf(step);
                            const thisIdx = stepOrder.indexOf(s.key);
                            const done = currentIdx > thisIdx;
                            const active = currentIdx === thisIdx;
                            return (
                                <div key={s.key} className={`signup-step ${active ? "signup-step-active" : ""} ${done ? "signup-step-done" : ""}`}>
                                    <div className="signup-step-icon">{done ? "✅" : s.icon}</div>
                                    <span>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    <ul className="auth-brand-features">
                        <li>🤖 AI learns your taste immediately</li>
                        <li>🎬 Access thousands of movies</li>
                        <li>📋 Build your personalised watchlist</li>
                        <li>🎉 Watch parties with friends</li>
                    </ul>
                </motion.div>

                {/* Right: Form */}
                <motion.div className="auth-form-panel" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
                    <div className="auth-form-card">

                        <AnimatePresence mode="wait">
                            {/* ── Step 1: Account Details ─────────────────── */}
                            {step === "account" && (
                                <motion.div key="account" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                                    <h2 className="auth-form-title">Create Account</h2>
                                    <p className="auth-form-subtitle">Step 1 of 2 — Your details</p>

                                    <div className="auth-form">
                                        <div className="auth-field">
                                            <label htmlFor="signup-username" className="auth-label">Username</label>
                                            <input id="signup-username" type="text" value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                onBlur={() => setTouched(t => ({ ...t, username: true }))}
                                                className={`auth-input ${usernameError ? "auth-input-error" : username.length >= 3 ? "auth-input-valid" : ""}`}
                                                placeholder="Choose a username" autoComplete="username" />
                                            {usernameError && <motion.span className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>⚠ {usernameError}</motion.span>}
                                        </div>

                                        <div className="auth-field">
                                            <label htmlFor="signup-email" className="auth-label">Email</label>
                                            <input id="signup-email" type="email" value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                                                className={`auth-input ${emailError ? "auth-input-error" : email.includes("@") ? "auth-input-valid" : ""}`}
                                                placeholder="you@example.com" autoComplete="email" />
                                            {emailError && <motion.span className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>⚠ {emailError}</motion.span>}
                                        </div>

                                        <div className="auth-field">
                                            <label htmlFor="signup-age" className="auth-label">Age</label>
                                            <input id="signup-age" type="number" value={age} min="1" max="120"
                                                onChange={e => setAge(e.target.value)}
                                                className="auth-input" placeholder="Your age" />
                                        </div>

                                        <div className="auth-field">
                                            <label htmlFor="signup-password" className="auth-label">Password</label>
                                            <div className="auth-input-wrapper">
                                                <input id="signup-password" type={showPw ? "text" : "password"} value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                                                    className={`auth-input auth-input-pw ${passwordError ? "auth-input-error" : password.length >= 6 ? "auth-input-valid" : ""}`}
                                                    placeholder="Min 6 characters" autoComplete="new-password" />
                                                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? "🙈" : "👁️"}</button>
                                            </div>
                                            {passwordError && <motion.span className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>⚠ {passwordError}</motion.span>}
                                            {/* Strength Bar */}
                                            {password.length > 0 && (
                                                <div className="pw-strength-bar">
                                                    <div className="pw-strength-bar-track">
                                                        <motion.div className="pw-strength-bar-fill"
                                                            style={{ width: `${(pwStrength.score / 3) * 100}%`, background: pwStrength.color }}
                                                            initial={{ width: 0 }} animate={{ width: `${(pwStrength.score / 3) * 100}%` }} />
                                                    </div>
                                                    <span className="pw-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="auth-field">
                                            <label htmlFor="signup-confirm" className="auth-label">Confirm Password</label>
                                            <input id="signup-confirm" type="password" value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                onBlur={() => setTouched(t => ({ ...t, confirm: true }))}
                                                className={`auth-input ${confirmError ? "auth-input-error" : confirmPassword && !confirmError ? "auth-input-valid" : ""}`}
                                                placeholder="Repeat your password" autoComplete="new-password" />
                                            {confirmError && <motion.span className="auth-field-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>⚠ {confirmError}</motion.span>}
                                        </div>

                                        <button id="signup-next-btn" type="button" onClick={() => {
                                            setTouched({ username: true, email: true, password: true, confirm: true });
                                            if (canProceed) setStep("preferences");
                                        }} className="auth-btn-primary">
                                            Next: Pick Your Genres →
                                        </button>
                                    </div>

                                    <p className="auth-switch-text">
                                        Already have an account?{" "}
                                        <a href="/login" className="auth-switch-link">Sign in →</a>
                                    </p>
                                </motion.div>
                            )}

                            {/* ── Step 2: Genre Preferences ───────────────── */}
                            {step === "preferences" && (
                                <motion.div key="preferences" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                                    <h2 className="auth-form-title">Your Taste 🎭</h2>
                                    <p className="auth-form-subtitle">Step 2 of 2 — Pick genres you love (select at least 1)</p>

                                    <div className="genre-grid">
                                        {ALL_GENRES.map(g => (
                                            <motion.button key={g} type="button"
                                                onClick={() => toggleGenre(g)}
                                                className={`genre-chip ${selectedGenres.includes(g) ? "genre-chip-selected" : ""}`}
                                                whileTap={{ scale: 0.94 }}
                                            >
                                                {selectedGenres.includes(g) ? "✓ " : ""}{g}
                                            </motion.button>
                                        ))}
                                    </div>

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div className="auth-error-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                ❌ {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                                        <button type="button" onClick={() => { setStep("account"); setError(""); }} className="auth-btn-secondary">← Back</button>
                                        <button id="signup-create-btn" type="button" onClick={handleSignup} disabled={selectedGenres.length < 1} className="auth-btn-primary" style={{ flex: 1 }}>
                                            🚀 Create My Account
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── Step 3: Creating ────────────────────────── */}
                            {(step === "creating" || step === "success") && (
                                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="auth-success-panel">
                                    {step === "creating" ? (
                                        <>
                                            <div className="auth-success-icon">⚙️</div>
                                            <h3>Setting up your account...</h3>
                                            <p>Training your personal AI recommendations</p>
                                            <div className="auth-spinner-lg" />
                                        </>
                                    ) : (
                                        <>
                                            <motion.div className="auth-success-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>🎉</motion.div>
                                            <h3>Account Created!</h3>
                                            <p>Welcome to CinemaX, {username}! Redirecting to your personalised feed...</p>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
