import { Image } from "expo-image";

/**
 * Thin wrapper around expo-image for game thumbnails and detail views.
 * Provides disk/memory caching, consistent contentFit, and a short load transition.
 */
export default function GameImage({
  source,
  style,
  contentFit = "cover",
  transition = 200,
  ...rest
}) {
  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      transition={transition}
      {...rest}
    />
  );
}
