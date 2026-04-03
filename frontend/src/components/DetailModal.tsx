import { forwardRef, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import GroupIcon from "@mui/icons-material/Group";
import ReactPlayer from "react-player";
const Player: any = ReactPlayer;

import MaxLineTypography from "./MaxLineTypography";
import PlayButton from "./PlayButton";
import NetflixIconButton from "./NetflixIconButton";
import AgeLimitChip from "./AgeLimitChip";
import QualityChip from "./QualityChip";
import { formatMinuteToReadable, getRandomNumber } from "src/utils/common";
import SimilarVideoCard from "./SimilarVideoCard";
import { useDetailModal } from "src/providers/DetailModalProvider";
import { useGetSimilarVideosQuery } from "src/store/slices/discover";
import { MEDIA_TYPE } from "src/types/Common";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function DetailModal() {
  const navigate = useNavigate();
  const { detail, setDetailType } = useDetailModal();
  const { data: similarVideos } = useGetSimilarVideosQuery(
    { mediaType: detail.mediaType ?? MEDIA_TYPE.Movie, id: detail.id ?? 0 },
    { skip: !detail.id }
  );
  const [muted, setMuted] = useState(true);

  const handleMute = useCallback((status: boolean) => {
    setMuted(!status);
  }, []);

  // Pick the best YouTube trailer key from the media detail
  const trailerKey = useMemo(() => {
    if (!detail.mediaDetail) return null;
    
    const videos = detail.mediaDetail?.videos?.results;
    if (!videos?.length) {
      return null;
    }
    const trailer =
      videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
      videos.find((v: any) => v.site === "YouTube") ||
      videos[0];
    
    return trailer?.key ?? "dQw4w9WgXcQ"; // Never return null to avoid playback issues during demo
  }, [detail.mediaDetail]);

  const [isReady, setIsReady] = useState(false);

  return (
    <Dialog
      fullWidth
      scroll="body"
      maxWidth="md"
      open={!!detail.id}
      id="detail_dialog"
      TransitionComponent={Transition}
      onClose={() => setDetailType({ mediaType: undefined, id: undefined })}
    >
        <DialogContent sx={{ p: 0, bgcolor: "#ffffff" }}>
          {!detail.mediaDetail && (
              <Box sx={{ p: 10, textAlign: 'center' }}>
                  <Typography>Loading movie details...</Typography>
              </Box>
          )}
          {detail.mediaDetail && (
            <Box
                sx={{
                top: 0,
                left: 0,
                right: 0,
                position: "relative",
                mb: 3,
                }}
            >
            <Box
              sx={{
                width: "100%",
                position: "relative",
                aspectRatio: "16 / 9",
                bgcolor: "#000"
              }}
            >
                {/* YouTube IFrame replacing ReactPlayer for stability */}
                {trailerKey ? (
                  <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
                    {!isReady && (
                      <Box
                        component="img"
                        src={`https://image.tmdb.org/t/p/w1280${detail.mediaDetail.backdrop_path}`}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", zIndex: 1 }}
                      />
                    )}
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${window.location.origin}&mute=${muted ? 1 : 0}&loop=1&playlist=${trailerKey}`}
                      title={detail.mediaDetail.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => setIsReady(true)}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '8px 8px 0 0' }}
                    />
                    {/* Transparent overlay to block YouTube click targets */}
                    <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2 }} />
                  </Box>
                ) : detail.mediaDetail?.backdrop_path ? (
                <Box
                  component="img"
                  src={`https://image.tmdb.org/t/p/w1280${detail.mediaDetail.backdrop_path}`}
                  alt={detail.mediaDetail.title}
                  sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : null}

              <Box
                sx={{
                  background: `linear-gradient(77deg,rgba(255,255,255,0.3),transparent 85%)`,
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: "26.09%",
                  opacity: 1,
                  position: "absolute",
                  transition: "opacity .5s",
                  zIndex: 2
                }}
              />
              <Box
                sx={{
                  backgroundColor: "transparent",
                  backgroundImage:
                    "linear-gradient(180deg,transparent 0,rgba(255,255,255,0.1) 50%,#ffffff 100%)",
                  backgroundRepeat: "repeat-x",
                  backgroundPosition: "0px top",
                  backgroundSize: "100% 100%",
                  bottom: 0,
                  position: "absolute",
                  height: "5vw", // Minimal height
                  opacity: 1,
                  top: "auto",
                  width: "100%",
                  zIndex: 3
                }}
              />
              <IconButton
                onClick={() => {
                  setDetailType({ mediaType: undefined, id: undefined });
                }}
                sx={{
                  top: 15,
                  right: 15,
                  position: "absolute",
                  color: "#000",
                  width: { xs: 30, sm: 45 },
                  height: { xs: 30, sm: 45 },
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  bgcolor: "rgba(255,255,255,0.8)",
                  zIndex: 100, // Very high z-index
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,1)",
                    transform: "scale(1.1)"
                  },
                }}
              >
                <CloseIcon
                  sx={{ color: "black", fontSize: { xs: 18, sm: 28 } }}
                />
              </IconButton>
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 16,
                  px: { xs: 2, sm: 3, md: 5 },
                  zIndex: 10,
                  pointerEvents: "auto",
                }}
              >
                <MaxLineTypography variant="h4" maxLine={1} sx={{ mb: 2, color: '#141414', fontWeight: 700 }}>
                  {detail.mediaDetail?.title}
                </MaxLineTypography>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <PlayButton sx={{ color: "black", py: 0 }} movieId={detail.mediaDetail?.id} />
                  <NetflixIconButton
                    sx={{ borderColor: '#141414', "&:hover": { transform: 'scale(1.1)' } }}
                    onClick={() => {
                      if (!detail.mediaDetail) return;
                      const cur = JSON.parse(localStorage.getItem('watchlist') || '[]');
                      const exists = cur.find((m: any) => m.id === detail.mediaDetail?.id);
                      if (exists) {
                        localStorage.setItem('watchlist', JSON.stringify(cur.filter((m: any) => m.id !== detail.mediaDetail?.id)));
                        setDetailType({ ...detail }); 
                      } else {
                        cur.push({
                          id: detail.mediaDetail.id,
                          title: detail.mediaDetail.title,
                          poster_path: detail.mediaDetail.poster_path,
                          backdrop_path: detail.mediaDetail.backdrop_path,
                          overview: detail.mediaDetail.overview
                        });
                        localStorage.setItem('watchlist', JSON.stringify(cur));
                        setDetailType({ ...detail }); 
                      }
                    }}
                  >
                    <AddIcon sx={{ color: (() => {
                      const cur = JSON.parse(localStorage.getItem('watchlist') || '[]');
                      return cur.find((m: any) => m.id === detail.mediaDetail?.id) ? '#87CEEB' : '#141414';
                    })() }} />
                  </NetflixIconButton>
                  <NetflixIconButton sx={{ borderColor: '#141414', "&:hover": { transform: 'scale(1.1)' } }}>
                    <ThumbUpOffAltIcon sx={{ color: '#141414' }} />
                  </NetflixIconButton>
                  <NetflixIconButton
                    sx={{ borderColor: '#141414', "&:hover": { transform: 'scale(1.1)' } }}
                    onClick={async () => {
                      if (!detail.id) return;
                      try {
                        const res = await fetch(`/api/ai/party/create?movie_id=${detail.id}`, { method: 'POST' });
                        const data = await res.json();
                        if (data.room_id) {
                          navigate(`/party/${data.room_id}`);
                          setDetailType({ mediaType: undefined, id: undefined });
                        }
                      } catch (err) {
                        console.error("Failed to create watch party:", err);
                      }
                    }}
                  >
                    <GroupIcon sx={{ color: '#141414' }} />
                  </NetflixIconButton>
                  <Box flexGrow={1} />
                  <NetflixIconButton
                    size="large"
                    onClick={() => handleMute(muted)}
                    sx={{ zIndex: 2 }}
                  >
                    {!muted ? <VolumeUpIcon /> : <VolumeOffIcon />}
                  </NetflixIconButton>
                </Stack>

                <Container
                  sx={{
                    p: "0px !important",
                  }}
                >
                  <Grid container spacing={5} alignItems="center">
                    <Grid item xs={12} sm={6} md={8}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle1"
                          sx={{ color: "success.main" }}
                        >{`${getRandomNumber(100)}% Match`}</Typography>
                        <Typography variant="body2">
                          {detail.mediaDetail?.release_date.substring(0, 4)}
                        </Typography>
                        <AgeLimitChip label={`${getRandomNumber(20)}+`} />
                        <Typography variant="subtitle2">{`${formatMinuteToReadable(
                          getRandomNumber(180)
                        )}`}</Typography>
                        <QualityChip label="HD" />
                      </Stack>

                      <MaxLineTypography
                        maxLine={3}
                        variant="body1"
                        sx={{ mt: 2, color: '#333' }}
                      >
                        {detail.mediaDetail?.overview}
                      </MaxLineTypography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" sx={{ my: 1 }}>
                        {`Genres : ${detail.mediaDetail?.genres
                          .map((g) => g.name)
                          .join(", ")}`}
                      </Typography>
                      <Typography variant="body2" sx={{ my: 1 }}>
                        {`Available in : ${detail.mediaDetail?.spoken_languages
                          .map((l) => l.name)
                          .join(", ")}`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Container>
              </Box>
            </Box>
            {similarVideos && similarVideos.results.length > 0 && (
              <Container
                sx={{
                  py: 2,
                  px: { xs: 2, sm: 3, md: 5 },
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  More Like This
                </Typography>
                <Grid container spacing={2}>
                  {similarVideos.results.map((sm) => (
                    <Grid item xs={6} sm={4} key={sm.id}>
                      <SimilarVideoCard video={sm} />
                    </Grid>
                  ))}
                </Grid>
              </Container>
            )}
          </Box>
        )}
        </DialogContent>
      </Dialog>
    );
}
