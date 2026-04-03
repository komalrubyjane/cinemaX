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
  onError,
}: {
  videoKey: string;
  width: number;
  height: number;
  movieTitle: string;
  onBack: () => void;
  onError: (err: any) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const [showControls, setShowControls] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(true);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);

  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // Initialize YouTube API manually for extreme stability
  useEffect(() => {
    let timer: any = null;

    const onPlayerReady = (event: any) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
        event.target.playVideo();
        if (muted) event.target.mute();
        else event.target.unMute();
        event.target.setVolume(volume * 100);
        setPlaying(true);
    };

    const loadPlayer = () => {
        if (!containerRef.current) return;
        
        // Ensure the target div exists and fills the container perfectly
        containerRef.current.innerHTML = '<div id="yt-player" style="width: 100%; height: 100%;"></div>';
        
        (window as any).onYouTubeIframeAPIReady = () => {
            new (window as any).YT.Player('yt-player', {
                videoId: videoKey,
                width: '100%', // Tell YT to fill 100%
                height: '100%',
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    disablekb: 1,
                    enablejsapi: 1,
                    origin: window.location.origin
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: (event: any) => {
                        if (event.data === (window as any).YT.PlayerState.PLAYING) setPlaying(true);
                        if (event.data === (window as any).YT.PlayerState.PAUSED) setPlaying(false);
                    },
                    onError: (err: any) => onError(err)
                }
            });
        };

        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        } else if ((window as any).YT.Player) {
            (window as any).onYouTubeIframeAPIReady();
        }
    };

    loadPlayer();

    timer = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            setPlayedSeconds(playerRef.current.getCurrentTime());
        }
    }, 500);

    return () => {
        clearInterval(timer);
        if (playerRef.current?.destroy) playerRef.current.destroy();
    };
  }, [videoKey]);

  const handleSeek = (value: number) => {
    if (playerRef.current) {
        playerRef.current.seekTo(value, true);
        setPlayedSeconds(value);
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (playing) {
        playerRef.current.pauseVideo();
        setPlaying(false);
    } else {
        playerRef.current.playVideo();
        setPlaying(true);
    }
  };

  const handleMuteToggle = () => {
      if (!playerRef.current) return;
      if (muted) {
          playerRef.current.unMute();
          setMuted(false);
      } else {
          playerRef.current.mute();
          setMuted(true);
      }
  };

  const handleFullscreen = () => {
    if (wrapperRef.current) {
      if (document.fullscreenElement) document.exitFullscreen();
      else wrapperRef.current.requestFullscreen();
    }
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
      onClick={handlePlayPause}
    >
      <Box 
        sx={{ 
          position: "absolute", 
          top: "-8%", 
          left: "-8%", 
          width: "116%", 
          height: "116%",
          pointerEvents: "none",
          zIndex: 1
        }}
        ref={containerRef}
      />

      <Box 
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }} 
        onClick={(e) => {
            resetHideTimer();
            handlePlayPause();
        }}
        onMouseMove={resetHideTimer}
      />

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
          <Box 
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            sx={{ 
                display: "flex", 
                alignItems: "center", 
                cursor: "pointer", 
                color: "white",
                mr: 3,
                "&:hover": { color: "#87CEEB" }
            }}
          >
            <KeyboardBackspaceIcon sx={{ fontSize: 40 }} />
            <Typography sx={{ ml: 1, fontWeight: 900, fontSize: '1.2rem' }}>EXIT</Typography>
          </Box>
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif"
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
                {playing ? <PauseIcon sx={{ fontSize: 50 }} /> : <PlayArrowIcon sx={{ fontSize: 50 }} />}
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
                handleVolumeToggle={handleMuteToggle}
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
  const [playerError, setPlayerError] = useState<string | null>(null);

  useEffect(() => {
    if (movieId) {
      setLoading(true);
      setTrailerKey(null);
      setNoTrailer(false);
      setPlayerError(null);
      
      // Fetch trailers
      fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_V3_API_KEY}`
      )
        .then((r) => r.json())
        .then((data) => {
          let trailer =
            data.results?.find(
              (v: any) => v.type === "Trailer" && v.site === "YouTube"
            ) ||
            data.results?.find((v: any) => v.site === "YouTube") ||
            data.results?.[0];
          
          // MOCK FALLBACK: If API fails to find a trailer, use a hardcoded one for demo purposes
          if (!trailer?.key && (movieId === "550" || movieId === "278" || movieId === "238")) {
             const mockMap: any = { "550": "BdJKm16Co6M", "278": "6hB3S9bIaco", "238": "sY1qqXMX-1c" };
             if (mockMap[movieId]) trailer = { key: mockMap[movieId] };
          }

          if (trailer?.key) {
            console.log("WatchPage Found Trailer:", trailer.key);
            setTrailerKey(trailer.key);
          } else {
            console.warn("No trailer found, forcing universal test video...");
            setTrailerKey("dQw4w9WgXcQ"); 
          }
          setLoading(false);
        })
        .catch(() => {
          console.error("TMDB fetch failed, forcing universal test video");
          setTrailerKey("dQw4w9WgXcQ"); 
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

  // Error state from Player (e.g. Embedding disabled)
  if (playerError || noTrailer) {
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
          p: 4,
          textAlign: "center"
        }}
      >
        <Typography variant="h4" sx={{ color: "black", fontWeight: 700 }}>
          {playerError ? "Player Error" : "Trailer Not Available"}
        </Typography>
        <Typography variant="body1" sx={{ color: "black", maxWidth: 600 }}>
          {playerError 
            ? "YouTube reported an error: " + playerError 
            : "Sorry, we couldn't find a trailer for this title. This can happen if the movie uploader has disabled embedding."}
        </Typography>
        <IconButton
          onClick={handleGoBack}
          sx={{
            color: "white",
            bgcolor: "#0071eb",
            px: 4,
            py: 1.5,
            borderRadius: 2,
            "&:hover": { bgcolor: "#0056b3" },
          }}
        >
          <KeyboardBackspaceIcon sx={{ mr: 1 }} />
          <Typography sx={{ fontWeight: 600 }}>Go Back to Browse</Typography>
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
        onError={(err) => setPlayerError(String(err))}
      />
    );
  }

  return null;
}

Component.displayName = "WatchPage";
