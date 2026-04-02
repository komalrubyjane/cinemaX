import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Player from "video.js/dist/types/player";
import { Box, Stack, Typography, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

import useWindowSize from "src/hooks/useWindowSize";
import { TMDB_V3_API_KEY } from "src/constant";
import MaxLineTypography from "src/components/MaxLineTypography";
import MainLoadingScreen from "src/components/MainLoadingScreen";

// ─── YouTube IFrame Player wrapper ───────────────────────────────────
function YouTubePlayer({
  videoKey,
  width,
  height,
  movieTitle,
  onBack,
}: {
  videoKey: string;
  width: number;
  height: number;
  movieTitle: string;
  onBack: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  const handleFullscreen = () => {
    const container = iframeRef.current?.parentElement?.parentElement;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        bgcolor: "#000000",
        overflow: "hidden",
        cursor: showControls ? "default" : "none",
      }}
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {/* YouTube iframe */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
        }}
      >
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&showinfo=0&iv_load_policy=3`}
          width="100%"
          height="100%"
          style={{ border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={movieTitle}
        />
      </Box>

      {/* Overlay controls */}
      {showControls && (
        <>
          {/* Back button */}
          <Box
            sx={{
              position: "absolute",
              top: 20,
              left: 20,
              zIndex: 10,
            }}
          >
            <IconButton
              onClick={onBack}
              sx={{
                color: "black",
                bgcolor: "rgba(0,0,0,0.6)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
            >
              <KeyboardBackspaceIcon />
            </IconButton>
          </Box>

          {/* Title overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "black",
                fontWeight: 700,
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                textAlign: "center",
              }}
            >
              {movieTitle}
            </Typography>
          </Box>

          {/* Fullscreen button */}
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              right: 20,
              zIndex: 10,
            }}
          >
            <IconButton
              onClick={handleFullscreen}
              sx={{
                color: "black",
                bgcolor: "rgba(0,0,0,0.6)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
            >
              <FullscreenIcon />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
}

// ─── Main WatchPage Component ────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const windowSize = useWindowSize();

  const searchParams = new URLSearchParams(window.location.search);
  const movieId = searchParams.get("id");

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [movieTitle, setMovieTitle] = useState("Now Playing");
  const [loading, setLoading] = useState(true);
  const [noTrailer, setNoTrailer] = useState(false);

  useEffect(() => {
    if (movieId) {
      // Fetch trailers
      fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_V3_API_KEY}`
      )
        .then((r) => r.json())
        .then((data) => {
          const trailer =
            data.results?.find(
              (v: any) => v.type === "Trailer" && v.site === "YouTube"
            ) ||
            data.results?.find((v: any) => v.site === "YouTube") ||
            data.results?.[0];
          if (trailer?.key) {
            setTrailerKey(trailer.key);
          } else {
            setNoTrailer(true);
          }
          setLoading(false);
        })
        .catch(() => {
          setNoTrailer(true);
          setLoading(false);
        });

      // Fetch movie details for the title
      fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_V3_API_KEY}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.title) setMovieTitle(data.title);
        })
        .catch(() => {});
    } else {
      setLoading(false);
      setNoTrailer(true);
    }
  }, [movieId]);

  const handleGoBack = () => {
    navigate("/browse");
  };

  // Loading state
  if (loading) {
    return <MainLoadingScreen />;
  }

  // No trailer found – show message
  if (noTrailer) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          bgcolor: "#000000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <Typography variant="h4" sx={{ color: "black", fontWeight: 700 }}>
          Trailer Not Available
        </Typography>
        <Typography variant="body1" sx={{ color: "#999" }}>
          Sorry, we couldn't find a trailer for this title.
        </Typography>
        <IconButton
          onClick={handleGoBack}
          sx={{
            color: "black",
            bgcolor: "rgba(0,0,0,0.1)",
            px: 4,
            py: 1.5,
            borderRadius: 2,
            "&:hover": { bgcolor: "rgba(0,0,0,0.2)" },
          }}
        >
          <KeyboardBackspaceIcon sx={{ mr: 1 }} />
          <Typography>Go Back</Typography>
        </IconButton>
      </Box>
    );
  }

  // YouTube trailer player
  if (trailerKey) {
    return (
      <YouTubePlayer
        videoKey={trailerKey}
        width={windowSize.width ?? 0}
        height={windowSize.height ?? 0}
        movieTitle={movieTitle}
        onBack={handleGoBack}
      />
    );
  }

  return null;
}

Component.displayName = "WatchPage";
