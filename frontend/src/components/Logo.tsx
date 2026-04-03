import Box, { BoxProps } from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

export default function Logo({ sx }: BoxProps) {
  return (
    <RouterLink to={`/${MAIN_PATH.browse}`} style={{ textDecoration: "none" }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 900,
          color: "#2563eb",
          letterSpacing: 3,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: { xs: "1.4rem", md: "1.8rem" },
          ...sx,
        }}
      >
        CINEMAX
      </Typography>
    </RouterLink>
  );
}

