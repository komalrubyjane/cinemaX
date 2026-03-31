"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<any[]>([]);

    useEffect(() => {
        let profs = localStorage.getItem("profiles");
        if (!profs || profs === "[]") {
            const defaultProfiles = [
                { _id: '1', name: 'Admin', type: 'Adult', avatar: '1' }
            ];
            localStorage.setItem("profiles", JSON.stringify(defaultProfiles));
            setProfiles(defaultProfiles);
        } else {
            setProfiles(JSON.parse(profs));
        }
    }, []);

    const selectProfile = (p: any) => {
        localStorage.setItem("activeProfile", JSON.stringify(p));
        router.push("/");
    };

    const handleManage = async () => {
        const name = prompt("Enter new profile name:");
        if (!name) return;
        const type = prompt("Enter profile type (Adult/Kids/Family):", "Family");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                // Fallback to local storage only if not logged in
                const newProfile = { _id: Date.now().toString(), name, type: type || 'Adult', avatar: '1' };
                const updated = [...profiles, newProfile];
                setProfiles(updated);
                localStorage.setItem("profiles", JSON.stringify(updated));
                return;
            }

            const res = await fetch("/api/backend/profiles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-auth-token": token
                },
                body: JSON.stringify({ name, type: type || "Adult", avatar: "1" })
            });
            const updatedProfiles = await res.json();

            if (res.ok) {
                setProfiles(updatedProfiles);
                localStorage.setItem("profiles", JSON.stringify(updatedProfiles));
            } else {
                alert(updatedProfiles.msg || "Failed to add profile");
            }
        } catch (e) {
            console.error(e);
            alert("Error adding profile");
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl md:text-5xl text-white font-bold mb-10">Who's watching?</h1>

            <div className="flex flex-wrap gap-8 justify-center">
                {profiles.map((p, idx) => (
                    <motion.div
                        key={p._id || idx}
                        whileHover={{ scale: 1.1 }}
                        className="flex flex-col items-center cursor-pointer group"
                        onClick={() => selectProfile(p)}
                    >
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-md bg-gradient-to-br from-red-600 to-purple-600 border-4 border-transparent group-hover:border-white transition-all shadow-lg flex items-center justify-center text-4xl">
                            {p.type === 'Kids' ? '🧒' : (p.type === 'Family' ? '👪' : '👤')}
                        </div>
                        <p className="text-zinc-400 group-hover:text-white mt-4 text-xl transition-colors">{p.name}</p>
                    </motion.div>
                ))}
            </div>

            <button
                onClick={handleManage}
                className="mt-16 border border-zinc-500 text-zinc-500 hover:text-white hover:border-white px-8 py-2 text-xl transition-colors uppercase tracking-widest"
            >
                Add Profile
            </button>
        </div>
    );
}
