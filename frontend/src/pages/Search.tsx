import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import SimilarVideoCard from "src/components/SimilarVideoCard";

export function Component() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    
    const activeProfileRaw = localStorage.getItem("activeProfile");
    const activeProfile = activeProfileRaw ? JSON.parse(activeProfileRaw) : { type: "Adult" };
    const profileType = activeProfile.type || "Adult";

    fetch(`/api/ai/search?query=${encodeURIComponent(query)}&profile_type=${profileType}`)
      .then(res => res.json())
      .then(data => {
        // Map backend format to TMDB format for the SimilarVideoCard
        const mapped = Array.isArray(data) ? data.map((m: any) => ({
          id: m.movieId,
          title: m.title,
          backdrop_path: m.poster,
          poster_path: m.poster,
          overview: m.genre,
        })) : [];
        setResults(mapped);
      })
      .catch()
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <Box sx={{ pt: 12, px: { xs: 2, sm: 4, md: 8 }, pb: 8, minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ mb: 4 }}>
        Search Results for "{query}"
      </Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : results.length === 0 ? (
        <Typography color="text.secondary">No related movies found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {results.map((video) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={video.id}>
              <SimilarVideoCard video={video} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

Component.displayName = "SearchPage";
