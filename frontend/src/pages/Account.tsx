import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import EmailIcon from "@mui/icons-material/Email";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IconButton from "@mui/material/IconButton";

export function Component() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const userId = localStorage.getItem("userId") || "N/A";
  
  // Simulated email (usually from auth/me) or just a mock
  const email = localStorage.getItem("email") || `${username.toLowerCase()}@cinemax.com`;

  const [isChangingPass, setIsChangingPass] = useState(false);

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
      <Box sx={{ maxWidth: 800, width: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 6 }}>
          <IconButton onClick={() => navigate("/browse")} sx={{ color: "black" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
            Account Settings
          </Typography>
        </Stack>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, 
          gap: 4 
        }}>
          {/* Left: Info Card */}
          <Box sx={{ 
            p: 4, 
            borderRadius: '24px', 
            bgcolor: 'rgba(0,162,255,0.05)', 
            border: '1px solid rgba(0,162,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <Avatar sx={{ 
              width: 100, 
              height: 100, 
              bgcolor: '#00a2ff', 
              fontSize: '2.5rem', 
              mb: 2,
              boxShadow: '0 8px 16px rgba(0,162,255,0.2)'
            }}>
              {username[0].toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{username}</Typography>
            <Typography variant="body2" color="text.secondary">Member Since 2026</Typography>
            <Typography variant="caption" sx={{ mt: 1, color: 'grey.500' }}>ID: {userId}</Typography>
          </Box>

          {/* Right: Settings Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" sx={{ color: '#00a2ff' }} /> Account Identity
              </Typography>
              <Stack spacing={3}>
                <TextField 
                  fullWidth 
                  label="Username" 
                  value={username} 
                  disabled 
                  variant="outlined" 
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} 
                />
                <TextField 
                  fullWidth 
                  label="Email Address" 
                  value={email} 
                  disabled 
                  variant="outlined" 
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} 
                />
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon fontSize="small" sx={{ color: '#00a2ff' }} /> Security & Privacy
              </Typography>
              {!isChangingPass ? (
                <Button 
                  variant="outlined" 
                  onClick={() => setIsChangingPass(true)}
                  sx={{ 
                    borderRadius: '12px', 
                    px: 3, 
                    fontWeight: 700,
                    color: '#141414',
                    borderColor: '#ddd',
                    "&:hover": { borderColor: '#00a2ff', color: '#00a2ff' }
                  }}
                >
                  Change Password
                </Button>
              ) : (
                <Stack spacing={2}>
                  <TextField 
                    type="password" 
                    fullWidth 
                    label="Current Password" 
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} 
                  />
                  <TextField 
                    type="password" 
                    fullWidth 
                    label="New Password" 
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} 
                  />
                  <Stack direction="row" spacing={2}>
                    <Button 
                      variant="contained" 
                      onClick={() => setIsChangingPass(false)}
                      sx={{ bgcolor: '#00a2ff', borderRadius: '12px', px: 4, fontWeight: 900 }}
                    >
                      Update
                    </Button>
                    <Button 
                      onClick={() => setIsChangingPass(false)}
                      sx={{ color: '#666', fontWeight: 700 }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Box>

            <Box sx={{ p: 3, borderRadius: '16px', bgcolor: '#fff9f9', border: '1px solid #fee' }}>
              <Typography variant="body2" sx={{ color: '#d32f2f', fontWeight: 700 }}>
                Danger Zone
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Once you delete your account, there is no going back. Please be certain.
              </Typography>
              <Button variant="text" sx={{ color: '#d32f2f', fontWeight: 700, textTransform: 'none' }}>
                Delete my account
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

Component.displayName = "AccountPage";
