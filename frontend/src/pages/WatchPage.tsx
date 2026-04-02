import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";

import ReactPlayer from "react-player";
const Player: any = ReactPlayer;
import PlayerSeekbar from "src/components/watch/PlayerSeekbar";
import VolumeControllers from "src/components/watch/VolumeControllers";
import useWindowSize from "src/hooks/useWindowSize";
import { TMDB_V3_API_KEY } from "src/constant";
import MainLoadingScreen from "src/components/MainLoadingScreen";

// ─── Custom YouTube Player wrapper ───────────────────────────────────
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
  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [showControls, setShowControls] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);

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
    if (wrapperRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        wrapperRef.current.requestFullscreen();
      }
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(!playing);
  };
  
  const handleSeek = (value: number) => {
    setPlayedSeconds(value);
    playerRef.current?.seekTo(value, "seconds");
  };

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        bgcolor: "#000000",
        overflow: "hidden",
        cursor: showControls ? "default" : "none",
      }}
      onMouseMove={resetHideTimer}
      onClick={() => {
        resetHideTimer();
        setPlaying(!playing);
      }}
    >
      {/* Custom ReactPlayer */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "120%",
          pointerEvents: "none", 
        }}
      >
        <Player
          ref={playerRef as any}
          url={`https://www.youtube.com/watch?v=${videoKey}`}
          width="100%"
          height="100%"
          style={{ transform: "translateY(-8.33%)" }}
          playing={playing}
          volume={volume}
          muted={muted}
          controls={false}
          onProgress={(p: any) => setPlayedSeconds(p.playedSeconds)}
          onDuration={(d: any) => setDuration(d)}
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                controls: 0,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                disablekb: 1,
                fs: 0,
              }
            } as any
          }}
        />
      </Box>

      {/* Overlay controls - Top Bar */}
      {showControls && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            p: 3,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconButton
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            sx={{ color: "white", mr: 2 }}
          >
            <KeyboardBackspaceIcon fontSize="large" />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              color: "white",
              fontWeight: 700,
            }}
          >
            {movieTitle}
          </Typography>
        </Box>
      )}

      {/* Overlay controls - Bottom Bar */}
      {showControls && (
        <Stack
          spacing={1}
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 3,
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Seekbar */}
          <Box sx={{ width: "100%", px: 1 }}>
            <PlayerSeekbar
              playedSeconds={playedSeconds}
              duration={duration}
              seekTo={handleSeek}
            />
          </Box>
          
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={handlePlayPause} sx={{ color: "white" }}>
                {playing ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
              </IconButton>
              
              <VolumeControllers
                value={volume}
                muted={muted}
                handleVolume={(e, val) => {
                  if (typeof val === "number") {
                    setVolume(val / 100);
                    if (val > 0) setMuted(false);
                  }
                }}
                handleVolumeToggle={() => setMuted(!muted)}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={handleFullscreen} sx={{ color: "white" }}>
                <FullscreenIcon fontSize="large" />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
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
          bgcolor: "#ffffff",
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
        <Typography variant="body1" sx={{ color: "black" }}>
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
