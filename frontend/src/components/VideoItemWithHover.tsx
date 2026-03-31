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

  const imgSrc = video.backdrop_path
    ? `${configuration?.images.base_url}w300${video.backdrop_path}`
    : video.poster_path
      ? `${configuration?.images.base_url}w300${video.poster_path}`
      : `https://via.placeholder.com/300x170/141414/E50914?text=${encodeURIComponent(video.title || "CINEMAX")}`;

  return (
    <VideoItemWithHoverPure
      ref={elementRef}
      handleHover={setIsHovered}
      src={imgSrc}
    />
  );
}
