import { useState } from "react";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import { Movie } from "src/types/Movie";
import NetflixIconButton from "./NetflixIconButton";
import MaxLineTypography from "./MaxLineTypography";
import { formatMinuteToReadable, getRandomNumber } from "src/utils/common";
import AgeLimitChip from "./AgeLimitChip";
import { useGetConfigurationQuery } from "src/store/slices/configuration";

interface SimilarVideoCardProps {
  video: Movie;
}

export default function SimilarVideoCard({ video }: SimilarVideoCardProps) {
  const { data: configuration } = useGetConfigurationQuery(undefined);

  const [inList, setInList] = useState(() => {
    const userId = localStorage.getItem("userId") || "1";
    const activeProfileRaw = localStorage.getItem("activeProfile");
    const activeProfile = activeProfileRaw ? JSON.parse(activeProfileRaw) : { _id: "1" };
    const listKey = `watchlist_${userId}_${activeProfile._id || '1'}`;
    const cur = JSON.parse(localStorage.getItem(listKey) || '[]');
    return cur.some((m: any) => m.id === video.id);
  });

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal when clicking the add button
    const userId = localStorage.getItem("userId") || "1";
    const activeProfileRaw = localStorage.getItem("activeProfile");
    const activeProfile = activeProfileRaw ? JSON.parse(activeProfileRaw) : { _id: "1" };
    const listKey = `watchlist_${userId}_${activeProfile._id || '1'}`;
    
    const cur = JSON.parse(localStorage.getItem(listKey) || '[]');
    if (inList) {
      localStorage.setItem(listKey, JSON.stringify(cur.filter((m: any) => m.id !== video.id)));
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
      localStorage.setItem(listKey, JSON.stringify(cur));
      setInList(true);
    }
  };

  const baseUrl = configuration?.images?.base_url || "https://image.tmdb.org/t/p/";
  const imgSrc = video.backdrop_path
    ? `${baseUrl}w780${video.backdrop_path}`
    : video.poster_path
      ? `${baseUrl}w780${video.poster_path}`
      : `https://image.tmdb.org/t/p/w780${video.backdrop_path || video.poster_path || ''}`;

  return (
    <Card>
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
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500&auto=format&fit=crop`;
          }}
          style={{
            top: 0,
            height: "100%",
            position: "absolute",
          }}
        />
        <div
          style={{
            top: 10,
            right: 15,
            position: "absolute",
          }}
        >
          <Typography variant="subtitle2">{`${formatMinuteToReadable(
            getRandomNumber(180)
          )}`}</Typography>
        </div>
        <div
          style={{
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
            maxLine={1}
            sx={{ width: "80%", fontWeight: 700 }}
            variant="subtitle1"
          >
            {video.title}
          </MaxLineTypography>
        </div>
      </div>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center">
            <div>
              <Typography
                variant="subtitle2"
                sx={{ color: "success.main" }}
              >{`${getRandomNumber(100)}% Match`}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <AgeLimitChip label={`${getRandomNumber(20)}+`} />
                <Typography variant="body2">
                  {(video.release_date || "").substring(0, 4)}
                </Typography>
              </Stack>
            </div>
            <div style={{ flexGrow: 1 }} />
            <NetflixIconButton onClick={handleAddToList}>
              {inList ? (
                <CheckIcon sx={{ color: "#4caf50" }} />
              ) : (
                <AddIcon />
              )}
            </NetflixIconButton>
          </Stack>
          <MaxLineTypography maxLine={4} variant="subtitle2">
            {video.overview}
          </MaxLineTypography>
        </Stack>
      </CardContent>
    </Card>
  );
}
