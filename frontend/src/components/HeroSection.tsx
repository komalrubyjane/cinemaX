import { useEffect, useState, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import ReactPlayer from "react-player";
const Player: any = ReactPlayer;

import { getRandomNumber } from "src/utils/common";
import MaxLineTypography from "./MaxLineTypography";
import PlayButton from "./PlayButton";
import MoreInfoButton from "./MoreInfoButton";
import NetflixIconButton from "./NetflixIconButton";
import MaturityRate from "./MaturityRate";
import useOffSetTop from "src/hooks/useOffSetTop";
import { useDetailModal } from "src/providers/DetailModalProvider";
import { MEDIA_TYPE } from "src/types/Common";
import {
  useGetVideosByMediaTypeAndCustomGenreQuery,
  useLazyGetAppendedVideosQuery,
} from "src/store/slices/discover";
import { Movie } from "src/types/Movie";

interface TopTrailerProps {
  mediaType: MEDIA_TYPE;
}

export default function TopTrailer({ mediaType }: TopTrailerProps) {
  const { data } = useGetVideosByMediaTypeAndCustomGenreQuery({
    mediaType,
    apiString: "popular",
    page: 1,
  });
  const [getVideoDetail, { data: detail }] = useLazyGetAppendedVideosQuery();
  const [video, setVideo] = useState<Movie | null>(null);
  const [muted, setMuted] = useState(true);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const isOffset = useOffSetTop(600);
  const { setDetailType } = useDetailModal();
  const maturityRate = useMemo(() => {
    return getRandomNumber(20);
  }, []);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (data && data.results) {
      const videos = data.results.filter((item) => !!item.backdrop_path);
      setVideo(videos[getRandomNumber(videos.length)]);
    }
  }, [data]);

  useEffect(() => {
    if (video) {
      getVideoDetail({ mediaType, id: video.id });
      setIsReady(false); // Reset on new video
    }
  }, [video]);

  useEffect(() => {
    if (detail?.videos?.results?.length) {
      const trailer =
        detail.videos.results.find(
          (v: any) => v.type === "Trailer" && v.site === "YouTube"
        ) ||
        detail.videos.results.find((v: any) => v.site === "YouTube") ||
        detail.videos.results[0];

      if (trailer?.key) {
        setVideoKey(trailer.key);
      } else {
        console.warn("Hero: No trailer found, forcing universal test video");
        setVideoKey("dQw4w9WgXcQ");
      }
    }
  }, [detail]);

  const handleMute = useCallback((status: boolean) => {
    const newMuted = !status;
    const cmd = newMuted ? 'mute' : 'unMute';
    // Use an ID or ref to match the iframe - for now targeting global iframes in Hero
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      // Very crude check for YT origin or title if possible
      if (iframe.src.includes('youtube.com/embed')) {
        iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
      }
    });
    setMuted(newMuted);
  }, []);

  return (
    <Box sx={{ position: "relative", zIndex: 1 }}>
      <Box
        sx={{
          mb: 3,
          pb: "40%",
          top: 0,
          left: 0,
          right: 0,
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "56.25vw",
            position: "absolute",
          }}
        >
          {video && (
            <>
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  position: "absolute",
                }}
              >
                {/* Fallback backdrop image when no video key or player not ready or scrolled past */}
                {(!videoKey || isOffset || !isReady) && video?.backdrop_path && (
                  <Box
                    component="img"
                    src={`https://image.tmdb.org/t/p/w1280${video.backdrop_path}`}
                    alt={video.title}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: 1, // Keep behind shadow but in front of player until ready
                    }}
                  />
                )}

                {/* ReactPlayer — hidden when user scrolls past hero */}
                {videoKey && !isOffset && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "-8%", // Crop top to hide titles
                      left: "-8%", // Crop side
                      width: "116%", // Zoom to fit
                      height: "116%", // Zoom to fit
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${window.location.origin}&mute=${muted ? 1 : 0}&loop=1&playlist=${videoKey}`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => {
                        console.log("Hero IFrame loaded");
                        setIsReady(true);
                      }}
                      style={{ width: '100%', height: '100%' }}
                    />
                    {/* Transparent click-blocker so YouTube logo/overlay can't be clicked */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2,
                        pointerEvents: "none",
                      }}
                    />
                  </Box>
                )}

                {/* Left shadow gradient - REMOVED for clean look */}
                <Box
                  sx={{
                    background: "transparent",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: "26.09%",
                    position: "absolute",
                    zIndex: 2,
                  }}
                />

                {/* Bottom fade gradient - REMOVED for clean look */}
                <Box
                  sx={{
                    background: "transparent",
                    bottom: 0,
                    position: "absolute",
                    height: "0px", 
                    opacity: 1,
                    width: "100%",
                    zIndex: 2,
                  }}
                />

                {/* Mute / Next / Maturity controls */}
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                    position: "absolute",
                    right: { xs: 20, md: 60 },
                    bottom: "35%",
                    zIndex: 15, // Ensure above everything
                  }}
                >
                  <NetflixIconButton
                    size="large"
                    onClick={() => {
                      if (data?.results) {
                        setVideo(data.results[getRandomNumber(data.results.length)]);
                      }
                    }}
                    sx={{ bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", border: '1px solid rgba(0,0,0,0.1)' }}
                    title="Next Trailer"
                  >
                    <span style={{ fontSize: '1.2rem', color: '#000', fontWeight: 'bold' }}>Next</span>
                  </NetflixIconButton>

                  <NetflixIconButton
                    size="large"
                    onClick={() => handleMute(muted)}
                  >
                    {!muted ? <VolumeUpIcon sx={{ color: '#000' }} /> : <VolumeOffIcon sx={{ color: '#000' }} />}
                  </NetflixIconButton>
                  <MaturityRate>{`${maturityRate}+`}</MaturityRate>
                </Stack>
              </Box>

              {/* Movie title / description / buttons layer */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <Stack
                  spacing={4}
                  sx={{
                    bottom: "35%",
                    position: "absolute",
                    left: { xs: "4%", md: "60px" },
                    top: 0,
                    width: "36%",
                    zIndex: 10,
                    justifyContent: "flex-end",
                    pointerEvents: "all",
                  }}
                >
                  <MaxLineTypography
                    variant="h2"
                    maxLine={1}
                    color="#141414"
                    sx={{ fontWeight: 950, fontFamily: "'Outfit', sans-serif" }}
                  >
                    {video.title}
                  </MaxLineTypography>
                  <MaxLineTypography
                    variant="h5"
                    maxLine={3}
                    color="#333"
                    sx={{ fontWeight: 500 }}
                  >
                    {video.overview}
                  </MaxLineTypography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <PlayButton size="large" movieId={video.id} />
                    <MoreInfoButton
                      size="large"
                      onClick={() => {
                        setDetailType({ mediaType, id: video.id });
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
