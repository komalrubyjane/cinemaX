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

  useEffect(() => {
    if (data && data.results) {
      const videos = data.results.filter((item) => !!item.backdrop_path);
      setVideo(videos[getRandomNumber(videos.length)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (video) {
      getVideoDetail({ mediaType, id: video.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video]);

  useEffect(() => {
    if (detail?.videos?.results?.length) {
      const trailer =
        detail.videos.results.find(
          (v: any) => v.type === "Trailer" && v.site === "YouTube"
        ) ||
        detail.videos.results.find((v: any) => v.site === "YouTube") ||
        detail.videos.results[0];
      if (trailer?.key) setVideoKey(trailer.key);
    }
  }, [detail]);

  const handleMute = useCallback((status: boolean) => {
    setMuted(!status);
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
                {/* ReactPlayer — hidden when user scrolls past hero */}
                {videoKey && !isOffset && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      overflow: "hidden",
                    }}
                  >
                    <Player
                      url={`https://www.youtube.com/watch?v=${videoKey}`}
                      playing={true}
                      muted={muted}
                      loop={true}
                      controls={false}
                      width="100%"
                      height="115%"
                      style={{ pointerEvents: "none", transform: 'scale(1.2)' }}
                      config={{
                        youtube: {
                          playerVars: {
                            autoplay: 1,
                            controls: 0,
                            disablekb: 1,
                            fs: 0,
                            iv_load_policy: 3,
                            modestbranding: 1,
                            rel: 0,
                            showinfo: 0,
                            playsinline: 1,
                            mute: 1
                          },
                        } as any,
                      }}
                    />
                    {/* Transparent click-blocker so YouTube logo/overlay can't be clicked */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1,
                      }}
                    />
                  </Box>
                )}

                {/* Fallback backdrop image when no video key */}
                {(!videoKey || isOffset) && video?.backdrop_path && (
                  <Box
                    component="img"
                    src={`https://image.tmdb.org/t/p/original${video.backdrop_path}`}
                    alt={video.title}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                )}

                {/* Left shadow gradient */}
                <Box
                  sx={{
                    background: `linear-gradient(77deg,rgba(0,0,0,.6),transparent 85%)`,
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: "26.09%",
                    opacity: 1,
                    position: "absolute",
                    transition: "opacity .5s",
                    zIndex: 2,
                  }}
                />

                {/* Bottom fade gradient */}
                <Box
                  sx={{
                    backgroundColor: "transparent",
                    backgroundImage:
                      "linear-gradient(180deg,hsla(0,0%,97.3%,0) 0,hsla(0,0%,97.3%,.15) 15%,hsla(0,0%,97.3%,.35) 29%,hsla(0,0%,97.3%,.58) 44%,#f8f9fa 68%,#f8f9fa)",
                    backgroundRepeat: "repeat-x",
                    backgroundPosition: "0px top",
                    backgroundSize: "100% 100%",
                    bottom: 0,
                    position: "absolute",
                    height: "14.7vw",
                    opacity: 1,
                    top: "auto",
                    width: "100%",
                    zIndex: 2,
                  }}
                />

                {/* Mute / Maturity controls */}
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: "center",
                    position: "absolute",
                    right: 0,
                    bottom: "35%",
                    zIndex: 3,
                  }}
                >
                  <NetflixIconButton
                    size="large"
                    onClick={() => handleMute(muted)}
                    sx={{ zIndex: 3 }}
                  >
                    {!muted ? <VolumeUpIcon /> : <VolumeOffIcon />}
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
                  zIndex: 3,
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
                    color="text.primary"
                  >
                    {video.title}
                  </MaxLineTypography>
                  <MaxLineTypography
                    variant="h5"
                    maxLine={3}
                    color="text.primary"
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
