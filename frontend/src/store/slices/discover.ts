import { TMDB_V3_API_KEY } from "src/constant";
import { tmdbApi } from "./apiSlice";
import { MEDIA_TYPE, PaginatedMovieResult } from "src/types/Common";
import { MovieDetail } from "src/types/Movie";
import { createSlice, isAnyOf } from "@reduxjs/toolkit";

// Mock data for when TMDB API is unavailable
const MOCK_MOVIES = [
  {
    id: 550,
    title: "Fight Club",
    name: "Fight Club",
    overview: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into much more.",
    backdrop_path: "/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
    poster_path: "/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
    vote_average: 8.8,
    release_date: "1999-10-15",
    media_type: "movie",
    popularity: 68.0,
    videos: {
      results: [
        {
          id: "4ae_kHfU8NE",
          type: "Trailer",
          site: "YouTube",
          key: "BdJKm16Co6M",
          name: "Fight Club Trailer",
          official: false,
          published_at: "2012-12-15T01:59:59.000Z"
        }
      ]
    }
  },
  {
    id: 278,
    title: "The Shawshank Redemption",
    name: "The Shawshank Redemption",
    overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    backdrop_path: "/kXfqcdQKsToO0OUXl4D5wLrTdal.jpg",
    poster_path: "/kXfqcdQKsToO0OUXl4D5wLrTdal.jpg",
    vote_average: 9.3,
    release_date: "1994-10-14",
    media_type: "movie",
    popularity: 81.0,
    videos: {
      results: [
        {
          id: "28RCIgVf0XI",
          type: "Trailer",
          site: "YouTube",
          key: "6hB3S9bIaco",
          name: "The Shawshank Redemption Trailer",
          official: false,
          published_at: "2012-11-22T12:00:00.000Z"
        }
      ]
    }
  },
  {
    id: 238,
    title: "The Godfather",
    name: "The Godfather",
    overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son Michael.",
    backdrop_path: "/tHbMIlGlmixvmeoNiB599dmN9Pv.jpg",
    poster_path: "/tHbMIlGlmixvmeoNiB599dmN9Pv.jpg",
    vote_average: 8.7,
    release_date: "1972-03-24",
    media_type: "movie",
    popularity: 79.0,
    videos: {
      results: [
        {
          id: "qk2fNxRB9lU",
          type: "Trailer",
          site: "YouTube",
          key: "sY1qqXMX-1c",
          name: "The Godfather Trailer",
          official: false,
          published_at: "2012-11-22T12:00:00.000Z"
        }
      ]
    }
  },
  {
    id: 240,
    title: "The Godfather Part II",
    name: "The Godfather Part II",
    overview: "The early life and rise of Vito Corleone and his struggle against the best and worst of America, plus his life before.",
    backdrop_path: "/rj7Sg79riR1O3XmjnIY5I3kQG2e.jpg",
    poster_path: "/rj7Sg79riR1O3XmjnIY5I3kQG2e.jpg",
    vote_average: 9.0,
    release_date: "1974-12-20",
    media_type: "movie",
    popularity: 66.0,
    videos: {
      results: []
    }
  },
  {
    id: 424,
    title: "Schindler's List",
    name: "Schindler's List",
    overview: "In Nazi-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.",
    backdrop_path: "/8fWVzJNiZlO9E8j5vVDpjl6ReeI.jpg",
    poster_path: "/8fWVzJNiZlO9E8j5vVDpjl6ReeI.jpg",
    vote_average: 8.9,
    release_date: "1993-12-15",
    media_type: "movie",
    popularity: 73.0,
    videos: {
      results: [
        {
          id: "kI__AJ0j3pI",
          type: "Trailer",
          site: "YouTube",
          key: "gG22XNhtnoY",
          name: "Schindler's List Trailer",
          official: false,
          published_at: "2012-11-22T12:00:00.000Z"
        }
      ]
    }
  },
];

const initialState: Record<string, Record<string, PaginatedMovieResult>> = {};
export const initialItemState: PaginatedMovieResult = {
  page: 0,
  results: [],
  total_pages: 0,
  total_results: 0,
};

const discoverSlice = createSlice({
  name: "discover",
  initialState,
  reducers: {
    setNextPage: (state, action) => {
      const { mediaType, itemKey } = action.payload;
      state[mediaType][itemKey].page += 1;
    },
    initiateItem: (state, action) => {
      const { mediaType, itemKey } = action.payload;
      if (!state[mediaType]) {
        state[mediaType] = {};
      }
      if (!state[mediaType][itemKey]) {
        state[mediaType][itemKey] = initialItemState;
      }
    },
  },
  extraReducers(builder) {
    builder.addMatcher(
      isAnyOf(
        extendedApi.endpoints.getVideosByMediaTypeAndCustomGenre.matchFulfilled,
        extendedApi.endpoints.getVideosByMediaTypeAndGenreId.matchFulfilled
      ),
      (state, action) => {
        const {
          page,
          results,
          total_pages,
          total_results,
          mediaType,
          itemKey,
        } = action.payload;
        state[mediaType][itemKey].page = page;
        state[mediaType][itemKey].results.push(...results);
        state[mediaType][itemKey].total_pages = total_pages;
        state[mediaType][itemKey].total_results = total_results;
      }
    );
  },
});

export const { setNextPage, initiateItem } = discoverSlice.actions;
export default discoverSlice.reducer;

const extendedApi = tmdbApi.injectEndpoints({
  endpoints: (build) => ({
    getVideosByMediaTypeAndGenreId: build.query<
      PaginatedMovieResult & {
        mediaType: MEDIA_TYPE;
        itemKey: number | string;
      },
      { mediaType: MEDIA_TYPE; genreId: number; page: number }
    >({
      query: ({ mediaType, genreId, page }) => ({
        url: `/discover/${mediaType}`,
        params: { api_key: TMDB_V3_API_KEY, with_genres: genreId, page },
      }),
      transformResponse: (
        response: PaginatedMovieResult,
        _,
        { mediaType, genreId }
      ) => ({
        ...response,
        mediaType,
        itemKey: genreId,
      }),
    }),
    getVideosByMediaTypeAndCustomGenre: build.query<
      PaginatedMovieResult & {
        mediaType: MEDIA_TYPE;
        itemKey: number | string;
      },
      { mediaType: MEDIA_TYPE; apiString: string; page: number }
    >({
      async queryFn(arg, queryApi, extraOptions, baseQuery) {
        // For AI recommendations, try the Python backend but fallback to TMDB
        if (arg.apiString === "cinemax_recs") {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch(`/recommend/1`, { 
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }
            const text = await res.text();
            if (!text) {
              throw new Error('Empty response');
            }
            const data = JSON.parse(text);
            const mappedResults = Array.isArray(data) ? data.map((m: any) => ({
              id: m.movieId,
              title: m.title,
              name: m.title,
              backdrop_path: m.poster,
              poster_path: m.poster,
              overview: m.reasons ? m.reasons.join(", ") : (m.genre || ""),
              media_type: arg.mediaType,
            })) : [];
            return {
              data: {
                page: 1,
                results: mappedResults,
                total_pages: 1,
                total_results: mappedResults.length,
                mediaType: arg.mediaType,
                itemKey: arg.apiString,
              }
            };
          } catch (e: any) {
            console.warn('AI recommendations unavailable, using TMDB popular instead:', e.message);
            // Fallback to TMDB popular movies
            try {
              const result = await baseQuery({
                url: `/${arg.mediaType}/popular`,
                params: { api_key: TMDB_V3_API_KEY, page: arg.page },
              });
              
              if (result.error) {
                return { error: result.error };
              }
              
              return {
                data: {
                  ...(result.data as any),
                  mediaType: arg.mediaType,
                  itemKey: arg.apiString,
                }
              };
            } catch (fallbackErr) {
              console.error('Fallback also failed:', fallbackErr);
              return { 
                data: {
                  page: 1,
                  results: [],
                  total_pages: 0,
                  total_results: 0,
                  mediaType: arg.mediaType,
                  itemKey: arg.apiString,
                }
              };
            }
          }
        }
        
        // For normal TMDB requests
        const result = await baseQuery({
          url: `/${arg.mediaType}/${arg.apiString}`,
          params: { api_key: TMDB_V3_API_KEY, page: arg.page },
        });
        
        if (result.error) {
          console.warn(`TMDB API error for ${arg.apiString}, using mock data instead`);
          // Return mock data when API fails
          return {
            data: {
              page: 1,
              results: MOCK_MOVIES,
              total_pages: 1,
              total_results: MOCK_MOVIES.length,
              mediaType: arg.mediaType,
              itemKey: arg.apiString,
            }
          };
        }
        
        return {
          data: {
            ...(result.data as any),
            mediaType: arg.mediaType,
            itemKey: arg.apiString,
          }
        };
      },
    }),
    getAppendedVideos: build.query<
      MovieDetail,
      { mediaType: MEDIA_TYPE; id: number }
    >({
      async queryFn(arg, queryApi, extraOptions, baseQuery) {
        try {
          console.log('getAppendedVideos: queryFn called with:', arg);
          
          const result = await baseQuery({
            url: `/${arg.mediaType}/${arg.id}`,
            params: { api_key: TMDB_V3_API_KEY, append_to_response: "videos" },
          });
          
          console.log('getAppendedVideos: baseQuery result:', result);
          
          if (result.error) {
            console.error('getAppendedVideos: RTK Query error:', result.error);
            // Return mock movie with videos when API fails
            return { 
              data: MOCK_MOVIES[0] as any as MovieDetail
            };
          }
          
          const data = result.data as MovieDetail;
          console.log('getAppendedVideos: Extracted data:', data);
          console.log('getAppendedVideos: Data type:', typeof data);
          console.log('getAppendedVideos: Data keys:', data ? Object.keys(data).slice(0, 10) : 'null');
          console.log('getAppendedVideos: Has videos?:', !!data?.videos);
          console.log('getAppendedVideos: Videos results length:', data?.videos?.results?.length || 0);
          
          return { data: data as MovieDetail };
        } catch (err: any) {
          console.error('getAppendedVideos: queryFn error:', err);
          return { 
            data: MOCK_MOVIES[0] as any as MovieDetail
          };
        }
      },
    }),
    getSimilarVideos: build.query<
      PaginatedMovieResult,
      { mediaType: MEDIA_TYPE; id: number }
    >({
      async queryFn({ mediaType, id }, queryApi, extraOptions, baseQuery) {
        const result = await baseQuery({
          url: `/${mediaType}/${id}/similar`,
          params: { api_key: TMDB_V3_API_KEY },
        });
        
        if (result.error) {
          // Return mock movies as fallback
          return {
            data: {
              page: 1,
              results: MOCK_MOVIES.slice(1) as any,
              total_pages: 1,
              total_results: MOCK_MOVIES.length - 1,
            } as PaginatedMovieResult
          };
        }
        
        return { data: result.data as PaginatedMovieResult };
      }
    }),
  }),
});

export const {
  useGetVideosByMediaTypeAndGenreIdQuery,
  useLazyGetVideosByMediaTypeAndGenreIdQuery,
  useGetVideosByMediaTypeAndCustomGenreQuery,
  useLazyGetVideosByMediaTypeAndCustomGenreQuery,
  useGetAppendedVideosQuery,
  useLazyGetAppendedVideosQuery,
  useGetSimilarVideosQuery,
  useLazyGetSimilarVideosQuery,
} = extendedApi;
