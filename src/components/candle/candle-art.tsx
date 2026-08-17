type CandleArtProps = {
  src: string;
  width: number;
  height: number;
  alt?: string;
  className?: string;
};

export function CandleArt({ src, width, height, alt = "", className = "" }: CandleArtProps) {
  return (
    // Pixel-art assets are rendered at their authored dimensions, without image optimization or smoothing.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={width}
      height={height}
      alt={alt}
      draggable={false}
      className={`pixel-asset block select-none ${className}`}
    />
  );
}
