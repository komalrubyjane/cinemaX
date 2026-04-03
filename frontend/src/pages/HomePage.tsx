import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { COMMON_TITLES } from "src/constant";
import HeroSection from "src/components/HeroSection";
import { genreSliceEndpoints, useGetGenresQuery } from "src/store/slices/genre";
import { MEDIA_TYPE } from "src/types/Common";
import { CustomGenre, Genre } from "src/types/Genre";
import SliderRowForGenre from "src/components/VideoSlider";
import store from "src/store";

export async function loader() {
  try {
    await store.dispatch(
      genreSliceEndpoints.getGenres.initiate(MEDIA_TYPE.Movie)
    );
  } catch (err) {
    console.warn("Failed to load genres in loader:", err);
  }
  return null;
}

export function Component() {
  console.log("HomePage Component rendering");
  
  try {
    const { data: genres, isLoading, isError } = useGetGenresQuery(MEDIA_TYPE.Movie);
    console.log("Genres query result:", { genres: genres?.length || 0, isLoading, isError });

    const displayGenres = genres && genres.length > 0 ? genres : [];

    return (
      <Box sx={{ 
        width: "100%", 
        minHeight: '100vh',
        bgcolor: "background.default", 
        color: "text.primary" 
      }}>
        <Box sx={{ mb: 4 }}>
          <HeroSection mediaType={MEDIA_TYPE.Movie} />
        </Box>
        
        {isError && (
          <Box sx={{ p: 2, mx: 2, bgcolor: "rgba(255,0,0,0.05)", borderRadius: 1 }}>
            <Typography sx={{ color: "error.main" }}>Genre load failed - showing popular movies</Typography>
          </Box>
        )}
        
        {isLoading && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "grey.600" }}>Loading cinematic experience...</Typography>
          </Box>
        )}
        
        <Box sx={{ pb: 10 }}>
          {[...COMMON_TITLES, ...displayGenres].map((genre: Genre | CustomGenre) => (
            <Box key={genre.id || genre.name} sx={{ mb: 6 }}>
              <SliderRowForGenre
                genre={genre}
                mediaType={MEDIA_TYPE.Movie}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  } catch (err) {
    console.error("HomePage Component error:", err);
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "#000", bgcolor: "#fff", minHeight: '100vh' }}>
        <Typography variant="h6">Something went wrong. Please refresh.</Typography>
      </Box>
    );
  }
}

Component.displayName = "HomePage";

Component.displayName = "HomePage";
