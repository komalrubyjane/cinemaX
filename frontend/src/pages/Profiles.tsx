import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { motion } from "framer-motion";

export function Component() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    const profs = localStorage.getItem("profiles");
    if (!profs || profs === "[]") {
      const defaultProfiles = [{ _id: "1", name: "Admin", type: "Adult", avatar: "1" }];
      localStorage.setItem("profiles", JSON.stringify(defaultProfiles));
      setProfiles(defaultProfiles);
    } else {
      setProfiles(JSON.parse(profs));
    }
  }, []);

  const selectProfile = (p: any) => {
    console.log('selectProfile clicked:', p.name);
    localStorage.setItem("activeProfile", JSON.stringify(p));
    console.log('About to navigate to /browse');
    navigate("/browse");
    console.log('Navigate called');
  };

  const handleManage = () => {
    const name = prompt("Enter new profile name:");
    if (!name) return;
    const type = prompt("Enter profile type (Adult/Kids/Family):", "Family");

    const newProfile = { _id: Date.now().toString(), name, type: type || "Adult", avatar: "1" };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem("profiles", JSON.stringify(updated));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <Typography variant="h3" sx={{ color: "#141414", mb: 8, fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
        Who's watching?
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 4, md: 6 }, justifyContent: "center" }}>
        {profiles.map((p, idx) => (
          <Box
            key={p._id || idx}
            onClick={() => {
              console.log('Profile box clicked:', p._id);
              selectProfile(p);
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.08)",
              },
              "&:hover .profile-img": {
                borderColor: "#00a2ff",
                boxShadow: "0 0 24px rgba(0,162,255,0.25)"
              },
              "&:hover .profile-name": {
                color: "#00a2ff",
              },
            }}
          >
            <Box
              className="profile-img"
              sx={{
                width: { xs: 120, md: 160 },
                height: { xs: 120, md: 160 },
                borderRadius: 2,
                bgcolor: "#f5f5f5",
                backgroundImage: p.type === "Kids" ? "url('/assets/kids-avatar.png')" : "url('/avatar.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "4px solid transparent",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "4rem",
              }}
            >
              {/* Fallbacks if image not found */}
              {p.type === 'Kids' ? '🧒' : (p.type === 'Family' ? '👪' : '')}
            </Box>
            <Typography
              className="profile-name"
              sx={{
                mt: 2,
                color: "#666",
                fontWeight: 600,
                fontSize: { xs: "1.1rem", md: "1.3rem" },
                transition: "color 0.3s ease",
              }}
            >
              {p.name}
            </Typography>
          </Box>
        ))}
      </Box>

      <Button
        variant="outlined"
        onClick={handleManage}
        sx={{
          mt: 10,
          color: "#666",
          borderColor: "#ddd",
          letterSpacing: 2,
          px: 5,
          py: 1.5,
          fontWeight: 600,
          fontSize: "1rem",
          "&:hover": {
            color: "#00a2ff",
            borderColor: "#00a2ff",
            bgcolor: "rgba(0,162,255,0.05)",
          },
        }}
      >
        MANAGE PROFILES
      </Button>
    </Box>
  );
}

Component.displayName = "ProfilesPage";
