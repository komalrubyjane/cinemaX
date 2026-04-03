import type { PaletteMode } from "@mui/material";

const PRIMARY = {
  light: "#e1f5fe",
  main: "#87CEEB",
  dark: "#4fa3d1",
};
const GREY = {
  100: "#F9FAFB",
  200: "#F4F6F8",
  300: "#DFE3E8",
  400: "#C4CDD5",
  500: "#919EAB",
  600: "#637381",
  700: "#454F5B",
  800: "#212B36",
  900: "#161C24",
};

const COMMON = {
  common: { black: "#000", white: "#fff" },
  primary: { ...PRIMARY, contrastText: "#fff" },
  grey: GREY,
  action: {
    active: GREY[500],
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
};

const palette = {
  ...COMMON,
  text: { primary: "#212B36", secondary: GREY[600], disabled: GREY[500] },
  background: { default: "#F9FAFB", paper: "#FFFFFF" },
  mode: "light" as PaletteMode,
};

export default palette;
