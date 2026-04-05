import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { motion, AnimatePresence } from "framer-motion";

export function Component() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId") || "1";
    const PROFILES_KEY = `profiles_${userId}`;
    
    const profs = localStorage.getItem(PROFILES_KEY);
    const profList = profs ? JSON.parse(profs) : [];
    const hasDefault = profList.length > 0;

    if (!profs || profList.length === 0) {
      const defaultProfiles = [
        { _id: "1", name: "User", type: "Adult", avatar: "1" },
        { _id: "2", name: "Family", type: "Family", avatar: "2" },
        { _id: "3", name: "Kids", type: "Kids", avatar: "3" },
      ];
      localStorage.setItem(PROFILES_KEY, JSON.stringify(defaultProfiles));
      setProfiles(defaultProfiles);
    } else {
      setProfiles(profList);
    }
  }, []);

  const selectProfile = (p: any) => {
    const userId = localStorage.getItem("userId") || "1";
    const ACTIVE_PROFILE_KEY = `activeProfile_${userId}`;
    
    if (isEditing) {
      handleEdit(p);
      return;
    }
    localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(p));
    // Keep 'activeProfile' as a global alias for convenience
    localStorage.setItem("activeProfile", JSON.stringify(p));
    navigate("/browse");
  };

  const handleEdit = (p: any) => {
    const userId = localStorage.getItem("userId") || "1";
    const PROFILES_KEY = `profiles_${userId}`;
    const ACTIVE_PROFILE_KEY = `activeProfile_${userId}`;

    const newName = prompt("Edit profile name:", p.name);
    if (!newName) return;
    const newType = prompt("Edit profile type (Adult/Kids/Family):", p.type);
    
    const updated = profiles.map(prof => 
      prof._id === p._id ? { ...prof, name: newName, type: newType || "Adult" } : prof
    );
    setProfiles(updated);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    
    // Update active profile if it was the one edited
    const activeRaw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeRaw && JSON.parse(activeRaw)._id === p._id) {
       const newProfile = { ...p, name: newName, type: newType || "Adult" };
       localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(newProfile));
       localStorage.setItem("activeProfile", JSON.stringify(newProfile));
    }
  };

  const handleAdd = () => {
    const userId = localStorage.getItem("userId") || "1";
    const PROFILES_KEY = `profiles_${userId}`;

    const name = prompt("Enter new profile name:");
    if (!name) return;
    const type = prompt("Enter profile type (Adult/Kids/Family):", "Family");

    const newProfile = { _id: Date.now().toString(), name, type: type || "Adult", avatar: "1" };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
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
        {isEditing ? "Manage Profiles" : "Who's watching?"}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 4, md: 6 }, justifyContent: "center" }}>
        {profiles.map((p, idx) => (
          <Box
            key={p._id || idx}
            onClick={() => selectProfile(p)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              position: "relative",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.08)" },
              "&:hover .profile-img": {
                borderColor: isEditing ? "#ffffff" : "#00a2ff",
                boxShadow: "0 0 24px rgba(0,162,255,0.25)"
              },
              "&:hover .profile-name": { color: isEditing ? "#666" : "#00a2ff" },
            }}
          >
            <Box
              className="profile-img"
              sx={{
                width: { xs: 120, md: 160 },
                height: { xs: 120, md: 160 },
                borderRadius: 2,
                bgcolor: p.type === "Kids" ? "#ffc107" : (p.type === "Family" ? "#4caf50" : "#00a2ff"),
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "4px solid transparent",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "4.5rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                position: "relative"
              }}
            >
              {p.type === 'Kids' ? '🧒' : (p.type === 'Family' ? '👪' : '👤')}
              
              {isEditing && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    bgcolor: "rgba(0,0,0,0.4)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10
                  }}
                >
                  <EditIcon sx={{ color: "white", fontSize: "2.5rem" }} />
                </Box>
              )}
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

      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 10 }}>
        <Button
          variant="outlined"
          onClick={() => setIsEditing(!isEditing)}
          sx={{
            color: isEditing ? "#ffffff" : "#666",
            bgcolor: isEditing ? "#00a2ff" : "transparent",
            borderColor: isEditing ? "#00a2ff" : "#ddd",
            letterSpacing: 2,
            px: 5, py: 1.5,
            fontWeight: 700,
            "&:hover": {
              color: "#00a2ff",
              borderColor: "#00a2ff",
              bgcolor: "rgba(0,162,255,0.05)",
            },
          }}
        >
          {isEditing ? "DONE" : "MANAGE PROFILES"}
        </Button>
        {!isEditing && (
          <Button
            variant="outlined"
            onClick={handleAdd}
            sx={{
              color: "#666",
              borderColor: "#ddd",
              letterSpacing: 2,
              px: 5, py: 1.5,
              fontWeight: 700,
              "&:hover": {
                color: "#00a2ff",
                borderColor: "#00a2ff",
                bgcolor: "rgba(0,162,255,0.05)",
              },
            }}
          >
            ADD PROFILE
          </Button>
        )}
      </Stack>
    </Box>
  );
}

Component.displayName = "ProfilesPage";
