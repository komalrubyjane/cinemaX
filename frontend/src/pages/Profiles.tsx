import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

export function Component() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<any>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId") || "1";
    const PROFILES_KEY = `profiles_${userId}`;
    const profs = localStorage.getItem(PROFILES_KEY);
    const profList = profs ? JSON.parse(profs) : [];

    if (!profs || profList.length === 0) {
      const defaultProfiles = [
        { _id: "1", name: "User", type: "Adult", avatar: "👤" },
        { _id: "2", name: "Family", type: "Family", avatar: "👪" },
        { _id: "3", name: "Kids", type: "Kids", avatar: "🧒" },
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
      startEdit(p);
      return;
    }
    localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(p));
    localStorage.setItem("activeProfile", JSON.stringify(p));
    navigate("/browse");
  };

  const startEdit = (p: any) => {
    setCurrentEdit({ ...p });
    setIsNewRecord(false);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentEdit({ _id: Date.now().toString(), name: "", type: "Adult", avatar: "👤" });
    setIsNewRecord(true);
    setDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentEdit((prev: any) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    if (!currentEdit.name.trim()) return;

    const userId = localStorage.getItem("userId") || "1";
    const PROFILES_KEY = `profiles_${userId}`;
    const ACTIVE_PROFILE_KEY = `activeProfile_${userId}`;

    let updated;
    if (isNewRecord) {
      updated = [...profiles, currentEdit];
    } else {
      updated = profiles.map(p => p._id === currentEdit._id ? currentEdit : p);
    }

    setProfiles(updated);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    
    // Update active profile if it was the one edited
    const activeRaw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeRaw && JSON.parse(activeRaw)._id === currentEdit._id) {
       localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(currentEdit));
       localStorage.setItem("activeProfile", JSON.stringify(currentEdit));
    }

    setDialogOpen(false);
  };

  const isImage = (avatar: string) => avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));

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
                bgcolor: isImage(p.avatar) ? 'transparent' : (p.type === "Kids" ? "#ffc107" : (p.type === "Family" ? "#4caf50" : "#00a2ff")),
                backgroundImage: isImage(p.avatar) ? `url(${p.avatar})` : 'none',
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "4px solid transparent",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "4.5rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {!isImage(p.avatar) && p.avatar}
              
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

      {/* Edit/Add Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#fff",
            borderRadius: "24px",
            p: 2,
            minWidth: { xs: "90%", sm: 450 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textAlign: 'center', fontSize: '1.8rem' }}>
          {isNewRecord ? "Add Profile" : "Edit Profile"}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Box sx={{ position: 'relative' }}>
               <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: "24px",
                  bgcolor: isImage(currentEdit?.avatar) ? 'transparent' : "#00a2ff",
                  backgroundImage: isImage(currentEdit?.avatar) ? `url(${currentEdit.avatar})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '2px solid #eaeaea'
                }}
              >
                {!isImage(currentEdit?.avatar) && currentEdit?.avatar}
              </Box>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: -10,
                  right: -10,
                  bgcolor: '#141414',
                  color: 'white',
                  '&:hover': { bgcolor: '#333' }
                }}
              >
                <PhotoCameraIcon fontSize="small" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </IconButton>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Profile Name"
            variant="outlined"
            value={currentEdit?.name || ""}
            onChange={(e) => setCurrentEdit({ ...currentEdit, name: e.target.value })}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              }
            }}
          />

          <FormControl fullWidth variant="outlined">
            <InputLabel>Maturity Level</InputLabel>
            <Select
              label="Maturity Level"
              value={currentEdit?.type || "Adult"}
              onChange={(e) => setCurrentEdit({ ...currentEdit, type: e.target.value })}
              sx={{ borderRadius: "12px" }}
            >
              <MenuItem value="Adult">Adult (All Content)</MenuItem>
              <MenuItem value="Family">Family (Safe Filter)</MenuItem>
              <MenuItem value="Kids">Kids (Children Only)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ px: 4, borderRadius: '12px', fontWeight: 700, color: '#666' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveProfile}
            variant="contained"
            sx={{ 
              px: 5, 
              borderRadius: '12px', 
              fontWeight: 900, 
              bgcolor: '#00a2ff',
              '&:hover': { bgcolor: '#0084d1' }
            }}
          >
            {isNewRecord ? "Create" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

Component.displayName = "ProfilesPage";
