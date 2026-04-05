import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

export function Component() {
  const navigate = useNavigate();
  
  // Local state for account data
  const [username, setUsername] = useState(localStorage.getItem("username") || "User");
  const [avatar, setAvatar] = useState(localStorage.getItem("userAvatar") || "");
  const userId = localStorage.getItem("userId") || "N/A";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!username.trim()) return;
    localStorage.setItem("username", username);
    localStorage.setItem("userAvatar", avatar);
    
    // Refresh header by navigating briefly or just alerting
    alert("Account settings updated successfully! 🍿");
    navigate("/browse");
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      bgcolor: "#ffffff", 
      pt: 12, 
      pb: 6,
      px: { xs: 2, md: 8 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Box sx={{ maxWidth: 600, width: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 6 }}>
          <IconButton onClick={() => navigate("/browse")} sx={{ color: "black" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
            Edit Account Profile
          </Typography>
        </Stack>

        <Box sx={{ 
          p: 5, 
          borderRadius: '32px', 
          bgcolor: '#fff', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}>
          {/* Photo Section */}
          <Box sx={{ position: 'relative' }}>
            <Avatar 
                src={avatar}
                sx={{ 
                    width: 140, 
                    height: 140, 
                    bgcolor: '#00a2ff', 
                    fontSize: '3.5rem', 
                    boxShadow: '0 12px 24px rgba(0,162,255,0.15)',
                    border: '4px solid white'
                }}
            >
              {!avatar && username[0]?.toUpperCase()}
            </Avatar>
            <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: '#141414',
                  color: 'white',
                  '&:hover': { bgcolor: '#333' },
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '2px solid white'
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

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            ID: {userId}
          </Typography>

          {/* Name Section */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <TextField 
              fullWidth 
              label="Account Name" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined" 
              placeholder="Enter your name"
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderRadius: "16px",
                  bgcolor: '#f8fafc'
                } 
              }} 
            />
          </Box>

          <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 2 }}>
            <Button 
                onClick={handleSave}
                fullWidth
                variant="contained" 
                sx={{ 
                    bgcolor: '#00a2ff', 
                    borderRadius: '16px', 
                    py: 1.8,
                    fontWeight: 900,
                    boxShadow: '0 8px 20px rgba(0,162,255,0.2)',
                    '&:hover': { bgcolor: '#0084d1' }
                }}
            >
                Save Changes
            </Button>
            <Button 
                onClick={() => navigate("/browse")}
                fullWidth
                variant="outlined"
                sx={{ 
                    borderRadius: '16px', 
                    py: 1.8,
                    fontWeight: 700,
                    color: '#666',
                    borderColor: '#ddd'
                }}
            >
                Cancel
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

Component.displayName = "AccountPage";
