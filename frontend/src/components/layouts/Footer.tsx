import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#ffffff",
        color: "#141414",
        px: { xs: 4, md: 8 },
        py: 6,
        borderTop: "1px solid #eaeaea",
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1.5fr" }, gap: 8 }}>
        {/* Brand & About */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: "#0071eb", fontFamily: "'Outfit', sans-serif" }}>
            CINEMAX
          </Typography>
          <Typography variant="body2" sx={{ color: "#333", lineHeight: 1.8, maxWidth: 350 }}>
            CINEMAX is the next-generation cinematic streaming platform powered by advanced AI. 
            We provide a personalized, high-fidelity experience that helps you discover your 
            next favorite movie with expert intelligence and real-time synchronization.
          </Typography>
        </Box>

        {/* Quick Links */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#141414" }}>
            Explore
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Link href="#" underline="none" sx={{ color: "#555", fontSize: "0.9rem", "&:hover": { color: "#0071eb" } }}>Movies</Link>
            <Link href="#" underline="none" sx={{ color: "#555", fontSize: "0.9rem", "&:hover": { color: "#0071eb" } }}>Watch Party</Link>
            <Link href="#" underline="none" sx={{ color: "#555", fontSize: "0.9rem", "&:hover": { color: "#0071eb" } }}>AI Chatbot</Link>
          </Box>
        </Box>

        {/* Contact/Support */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#141414" }}>
            Support
          </Typography>
          <Typography variant="body2" sx={{ color: "#555", mb: 1 }}>
            Questions? Call 000-800-919-1743
          </Typography>
          <Typography variant="body2" sx={{ color: "#777", mt: 4, fontSize: "0.8rem" }}>
            © {new Date().getFullYear() === 2026 ? "2026" : "2026"} CINEMAX India. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
