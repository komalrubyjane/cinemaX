import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Movie } from "src/types/Movie";
import { usePortal } from "src/providers/PortalProvider";
import { useDetailModal } from "src/providers/DetailModalProvider";
import { formatMinuteToReadable, getRandomNumber } from "src/utils/common";
import NetflixIconButton from "./NetflixIconButton";
import MaxLineTypography from "./MaxLineTypography";
import AgeLimitChip from "./AgeLimitChip";
import QualityChip from "./QualityChip";
import GenreBreadcrumbs from "./GenreBreadcrumbs";
import { useGetConfigurationQuery } from "src/store/slices/configuration";
import { MEDIA_TYPE } from "src/types/Common";
import { useGetGenresQuery } from "src/store/slices/genre";
import { MAIN_PATH } from "src/constant";

interface VideoCardModalProps {
  video: Movie;
  anchorElement: HTMLElement;
}

export default function VideoCardModal({
  video,
  anchorElement,
}: VideoCardModalProps) {
  const navigate = useNavigate();
  const { data: configuration } = useGetConfigurationQuery(undefined);
  const { data: genres } = useGetGenresQuery(MEDIA_TYPE.Movie);
  const setPortal = usePortal();
  const rect = anchorElement.getBoundingClientRect();
  const { setDetailType } = useDetailModal();

  // Watchlist state
  const [inList, setInList] = useState(() => {
    const cur = JSON.parse(localStorage.getItem('watchlist') || '[]');
    return cur.some((m: any) => m.id === video.id);
  });

  const handleAddToList = () => {
    const cur = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (inList) {
      localStorage.setItem('watchlist', JSON.stringify(cur.filter((m: any) => m.id !== video.id)));
      setInList(false);
    } else {
      cur.push({
        id: video.id,
        title: video.title,
        poster_path: video.poster_path,
        backdrop_path: video.backdrop_path,
        overview: video.overview,
        release_date: video.release_date,
      });
      localStorage.setItem('watchlist', JSON.stringify(cur));
      setInList(true);
    }
  };

  const imgSrc = video.backdrop_path
    ? `${configuration?.images.base_url}w780${video.backdrop_path}`
    : video.poster_path
      ? `${configuration?.images.base_url}w780${video.poster_path}`
      : `https://image.tmdb.org/t/p/w780${video.backdrop_path || video.poster_path || ''}`;

  return (
    <Card
      onPointerLeave={() => {
        setPortal(null, null);
      }}
      sx={{
        width: rect.width * 1.5,
        height: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          position: "relative",
          paddingTop: "calc(9 / 16 * 100%)",
        }}
      >
        <img
          src={imgSrc}
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/780x439/141414/87CEEB?text=${encodeURIComponent(video.title || "CINEMAX")}`;
          }}
          style={{
            top: 0,
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            backgroundPosition: "50%",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            left: 0,
            right: 0,
            bottom: 0,
            paddingLeft: "16px",
            paddingRight: "16px",
            paddingBottom: "4px",
            position: "absolute",
          }}
        >
          <MaxLineTypography
            maxLine={2}
            sx={{ width: "80%", fontWeight: 700 }}
            variant="h6"
          >
            {video.title}
          </MaxLineTypography>
          <div style={{ flexGrow: 1 }} />
          <NetflixIconButton>
            <VolumeUpIcon />
          </NetflixIconButton>
        </div>
      </div>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <NetflixIconButton
              sx={{ p: 0 }}
              onClick={() => navigate(`/${MAIN_PATH.watch}?id=${video.id}`)}
            >
              <PlayCircleIcon sx={{ width: 40, height: 40 }} />
            </NetflixIconButton>
            <NetflixIconButton onClick={handleAddToList}>
              {inList ? (
                <CheckIcon sx={{ color: "#4caf50" }} />
              ) : (
                <AddIcon />
              )}
            </NetflixIconButton>
            <NetflixIconButton>
              <ThumbUpOffAltIcon />
            </NetflixIconButton>
            <div style={{ flexGrow: 1 }} />
            <NetflixIconButton
              onClick={() => {
                setDetailType({ mediaType: MEDIA_TYPE.Movie, id: video.id });
              }}
            >
              <ExpandMoreIcon />
            </NetflixIconButton>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="subtitle1"
              sx={{ color: "success.main" }}
            >{`${getRandomNumber(100)}% Match`}</Typography>
            <AgeLimitChip label={`${getRandomNumber(20)}+`} />
            <Typography variant="subtitle2">{`${formatMinuteToReadable(
              getRandomNumber(180)
            )}`}</Typography>
            <QualityChip label="HD" />
          </Stack>
          {genres && video.genre_ids && (
            <GenreBreadcrumbs
              genres={genres
                .filter((genre) => video.genre_ids.includes(genre.id))
                .map((genre) => genre.name)}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
