import * as React from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import GroupIcon from "@mui/icons-material/Group";
import useOffSetTop from "src/hooks/useOffSetTop";
import { APP_BAR_HEIGHT } from "src/constant";
import Logo from "../Logo";
import SearchBox from "../SearchBox";
import NetflixNavigationLink from "../NetflixNavigationLink";

const PAGES = [
  { name: "Home", path: "/browse" },
  { name: "My List", path: "/watchlist" },
];

const MainHeader = () => {
  const isOffset = useOffSetTop(APP_BAR_HEIGHT);
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Account";
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleJoinParty = () => {
    const roomId = prompt("Enter a Watch Party room ID (or leave empty to create one):");
    const finalRoom = roomId?.trim() || `party_${Date.now().toString(36)}`;
    navigate(`/party/${finalRoom}`);
  };

  return (
    <AppBar
      sx={{
        px: "60px",
        height: APP_BAR_HEIGHT,
        backgroundImage: "none",
        ...(isOffset
          ? {
              bgcolor: "primary.main",
              boxShadow: (theme) => theme.shadows[4],
            }
          : { boxShadow: 0, bgcolor: "transparent" }),
      }}
    >
      <Toolbar disableGutters>
        <Logo sx={{ mr: { xs: 2, sm: 4 } }} />

        <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
          <IconButton
            size="large"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorElNav}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            keepMounted
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{ display: { xs: "block", md: "none" } }}
          >
            {PAGES.map((page) => (
              <MenuItem key={page.name} onClick={() => { handleCloseNavMenu(); navigate(page.path); }}>
                <Typography textAlign="center">{page.name}</Typography>
              </MenuItem>
            ))}
            <MenuItem onClick={() => { handleCloseNavMenu(); handleJoinParty(); }}>
              <Typography textAlign="center">Join Party</Typography>
            </MenuItem>
          </Menu>
        </Box>

        <Stack
          direction="row"
          spacing={3}
          sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}
        >
          {PAGES.map((page) => (
            <NetflixNavigationLink
              key={page.name}
              to={page.path}
              variant="subtitle1"
              onClick={handleCloseNavMenu}
            >
              {page.name}
            </NetflixNavigationLink>
          ))}
        </Stack>

        <Box sx={{ flexGrow: 0, display: "flex", gap: 2, alignItems: "center" }}>
          <SearchBox />
          <Tooltip title="Join Watch Party">
            <IconButton
              onClick={handleJoinParty}
              sx={{
                color: "white",
                bgcolor: "rgba(229, 9, 20, 0.2)",
                "&:hover": { bgcolor: "rgba(229, 9, 20, 0.5)" },
                display: { xs: "none", md: "flex" },
              }}
            >
              <GroupIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={username}>
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt="user_avatar" src="/avatar.png" variant="rounded" />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: "45px" }}
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            keepMounted
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                {username}
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => { handleCloseUserMenu(); navigate("/profiles"); }}>
              <Typography textAlign="center">Switch Profile</Typography>
            </MenuItem>
            <MenuItem onClick={() => { handleCloseUserMenu(); handleJoinParty(); }}>
              <Typography textAlign="center">Join Watch Party</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Typography textAlign="center" sx={{ color: "#E50914" }}>Sign Out</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
export default MainHeader;
