import { Outlet, useLocation, useNavigation, Navigate } from "react-router-dom";
import Box from "@mui/material/Box";

import DetailModal from "src/components/DetailModal";
import VideoPortalContainer from "src/components/VideoPortalContainer";
import DetailModalProvider from "src/providers/DetailModalProvider";
import PortalProvider from "src/providers/PortalProvider";
import { MAIN_PATH } from "src/constant";
import { Footer, MainHeader } from "src/components/layouts";
import MainLoadingScreen from "src/components/MainLoadingScreen";
import MovieChatbot from "src/components/MovieChatbot";

export default function MainLayout() {
  const location = useLocation();
  const navigation = useNavigation();
  const isAuthenticated = !!localStorage.getItem("token");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <MainHeader />
      {navigation.state !== "idle" && <MainLoadingScreen />}
      <DetailModalProvider>
        <DetailModal />
        <PortalProvider>
          <Outlet />
          <VideoPortalContainer />
        </PortalProvider>
      </DetailModalProvider>
      {location.pathname !== `/${MAIN_PATH.watch}` && <Footer />}
      <MovieChatbot />
    </Box>
  );
}
