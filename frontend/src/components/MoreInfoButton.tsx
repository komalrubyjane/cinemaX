import Button, { ButtonProps } from "@mui/material/Button";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function MoreInfoButton({ sx, ...others }: ButtonProps) {
  return (
    <Button
      variant="contained"
      startIcon={
        <InfoOutlinedIcon
          sx={{
            fontSize: {
              xs: "24px !important",
              sm: "32px !important",
              md: "40px !important",
            },
          }}
        />
      }
      {...others}
      sx={{
        ...sx,
        px: { xs: 1, sm: 2 },
        py: { xs: 0.5, sm: 1 },
        fontSize: { xs: 18, sm: 24, md: 28 },
        lineHeight: 1.5,
        fontWeight: "bold",
        textTransform: "capitalize",
        bgcolor: "rgba(0,0,0,0.1)",
        color: "black",
        whiteSpace: "nowrap",
        "&:hover": { bgcolor: "rgba(0,0,0,0.2)" },
      }}
    >
      More Info
    </Button>
  );
}
