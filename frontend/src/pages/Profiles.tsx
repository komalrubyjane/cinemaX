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
    localStorage.setItem("activeProfile", JSON.stringify(p));
    navigate("/browse");
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
        bgcolor: "#f4f6f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
      }}
    >
      <Typography variant="h3" sx={{ color: "#1c1c1c", mb: 8, fontWeight: "bold" }}>
        Who's watching?
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 4, md: 6 }, justifyContent: "center" }}>
        {profiles.map((p, idx) => (
          <Box
            component={motion.div}
            key={p._id || idx}
            whileHover={{ scale: 1.1 }}
            onClick={() => selectProfile(p)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              "&:hover .profile-img": {
                borderColor: "#004de6",
              },
              "&:hover .profile-name": {
                color: "#1c1c1c",
              },
            }}
          >
            <Box
              className="profile-img"
              sx={{
                width: { xs: 100, md: 150 },
                height: { xs: 100, md: 150 },
                borderRadius: 2,
                bgcolor: "background.paper",
                backgroundImage: p.type === "Kids" ? "url('/assets/kids-avatar.png')" : "url('/avatar.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "4px solid transparent",
                transition: "border-color 0.3s ease",
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
                color: "grey.600",
                fontSize: { xs: "1.2rem", md: "1.5rem" },
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
          mt: 8,
          color: "grey.700",
          borderColor: "grey.400",
          letterSpacing: 2,
          px: 4,
          py: 1.5,
          fontSize: "1.2rem",
          "&:hover": {
            color: "#1c1c1c",
            borderColor: "#1c1c1c",
            bgcolor: "rgba(0,0,0,0.05)",
          },
        }}
      >
        MANAGE PROFILES
      </Button>
    </Box>
  );
}

Component.displayName = "ProfilesPage";
