import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import SimilarVideoCard from "src/components/SimilarVideoCard";

export function Component() {
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // Simple interval to refresh watchlist from localStorage in case it changes
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setWatchlist(list);
  }, []);

  return (
    <Box sx={{ pt: 12, px: { xs: 2, sm: 4, md: 8 }, pb: 8, minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        My List
      </Typography>

      {watchlist.length === 0 ? (
        <Typography color="text.secondary">You haven't added any movies to your list yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {watchlist.map((video) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={video.id}>
              <SimilarVideoCard video={video} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

Component.displayName = "WatchlistPage";
