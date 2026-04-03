import { TMDB_V3_API_KEY } from "src/constant";
import { Genre } from "src/types/Genre";
import { tmdbApi } from "./apiSlice";

// Fallback genres when API is unavailable
const MOCK_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
];

const extendedApi = tmdbApi.injectEndpoints({
  endpoints: (build) => ({
    getGenres: build.query<Genre[], string>({
      async queryFn(mediaType, queryApi, extraOptions, baseQuery) {
        const result = await baseQuery({
          url: `/genre/${mediaType}/list`,
          params: { api_key: TMDB_V3_API_KEY },
        });

        if (result.error) {
          console.warn("Failed to load genres, using fallback");
          return { data: MOCK_GENRES };
        }

        const { genres } = result.data as { genres: Genre[] };
        return { data: genres };
      },
    }),
  }),
});

export const { useGetGenresQuery, endpoints: genreSliceEndpoints  } = extendedApi;
