import { PureComponent, ForwardedRef, forwardRef } from "react";

type VideoItemWithHoverPureType = {
  src: string;
  innerRef: ForwardedRef<HTMLDivElement>;
  handleHover: (value: boolean) => void;
};

class VideoItemWithHoverPure extends PureComponent<VideoItemWithHoverPureType> {
  render() {
    return (
      <div
        ref={this.props.innerRef}
        style={{
          zIndex: 9,
          cursor: "pointer",
          borderRadius: 0.5,
          width: "100%",
          position: "relative",
          paddingTop: "calc(9 / 16 * 100%)",
        }}
      >
        <img
          src={this.props.src}
          style={{
            top: 0,
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            borderRadius: "4px",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500&auto=format&fit=crop";
          }}
          onPointerEnter={() => {
            // console.log("onPointerEnter");
            this.props.handleHover(true);
          }}
          onPointerLeave={() => {
            // console.log("onPointerLeave");
            this.props.handleHover(false);
          }}
        />
      </div>
    );
  }
}

const VideoItemWithHoverRef = forwardRef<
  HTMLDivElement,
  Omit<VideoItemWithHoverPureType, "innerRef">
>((props, ref) => <VideoItemWithHoverPure {...props} innerRef={ref} />);
VideoItemWithHoverRef.displayName = "VideoItemWithHoverRef";

export default VideoItemWithHoverRef;
