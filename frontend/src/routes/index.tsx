import { Navigate, createBrowserRouter } from "react-router-dom";
import { MAIN_PATH } from "src/constant";

import MainLayout from "src/layouts/MainLayout";

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("src/pages/Landing"),
  },
  {
    path: "/login",
    lazy: () => import("src/pages/Login"),
  },
  {
    path: "/signup",
    lazy: () => import("src/pages/Signup"),
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/profiles",
        lazy: () => import("src/pages/Profiles"),
      },
      {
        path: MAIN_PATH.browse,
        lazy: () => import("src/pages/HomePage"),
      },
      {
        path: "/search",
        lazy: () => import("src/pages/Search"),
      },
      {
        path: "/watchlist",
        lazy: () => import("src/pages/Watchlist"),
      },
      {
        path: "/party/:id",
        lazy: () => import("src/pages/WatchParty"),
      },
      {
        path: MAIN_PATH.genreExplore,
        children: [
          {
            path: ":genreId",
            lazy: () => import("src/pages/GenreExplore"),
          },
        ],
      },
      {
        path: MAIN_PATH.watch,
        lazy: () => import("src/pages/WatchPage"),
      },
    ],
  },
]);

export default router;
