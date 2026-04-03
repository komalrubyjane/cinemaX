import { useEffect, useState, useRef } from "react";
import { Movie } from "src/types/Movie";
import { usePortal } from "src/providers/PortalProvider";
import { useGetConfigurationQuery } from "src/store/slices/configuration";
import VideoItemWithHoverPure from "./VideoItemWithHoverPure";
interface VideoItemWithHoverProps {
  video: Movie;
}

export default function VideoItemWithHover({ video }: VideoItemWithHoverProps) {
  const setPortal = usePortal();
  const elementRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { data: configuration } = useGetConfigurationQuery(undefined);

  useEffect(() => {
    if (isHovered) {
      setPortal(elementRef.current, video);
    }
  }, [isHovered]);

  const baseUrl = configuration?.images?.base_url || "https://image.tmdb.org/t/p/";
  const imgSrc = video.backdrop_path
    ? `${baseUrl}w300${video.backdrop_path}`
    : video.poster_path
      ? `${baseUrl}w300${video.poster_path}`
      : `https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500&auto=format&fit=crop`;

  return (
    <VideoItemWithHoverPure
      ref={elementRef}
      handleHover={setIsHovered}
      src={imgSrc}
    />
  );
}
