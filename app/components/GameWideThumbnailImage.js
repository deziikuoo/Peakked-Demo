import { useEffect, useState, useMemo, useCallback } from "react";
import { View, Image as RNImage, StyleSheet } from "react-native";
import GameImage from "./GameImage";
import {
  getGameWideThumbnailFallbackUri,
  getGameWideThumbnailUri,
} from "../data/shared/gameFormatters";

/** Final fallback when remote URLs fail (matches list rows) */
const PLACEHOLDER_LOGO = require("../assets/Logos/image logo WO BG.png");

const placeholderStyles = StyleSheet.create({
  fillCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  /** Hero / grid / modal: gentler scale than the narrow list strip */
  logo: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.22 }],
  },
});

/**
 * Landscape slots (hero, grid, watchlist thumb, modal, pickers): primary CDN URL →
 * alternate Steam asset → local logo. Uses RN `Image` for the placeholder (see GameListThumbnailImage).
 */
export default function GameWideThumbnailImage({
  game,
  style,
  contentFit = "cover",
  ...rest
}) {
  const primaryUri = useMemo(
    () => getGameWideThumbnailUri(game),
    [game?.id, game?.thumbnail, game?.background_image]
  );
  const fallbackUri = useMemo(
    () => getGameWideThumbnailFallbackUri(game),
    [game?.id, game?.thumbnail, game?.background_image]
  );

  const [phase, setPhase] = useState(() =>
    !primaryUri ? "placeholder" : "primary"
  );

  useEffect(() => {
    setPhase(!primaryUri ? "placeholder" : "primary");
  }, [primaryUri, fallbackUri]);

  const source = useMemo(() => {
    if (phase === "placeholder" || !primaryUri) return null;
    if (phase === "fallback" && fallbackUri) return { uri: fallbackUri };
    return { uri: primaryUri };
  }, [phase, primaryUri, fallbackUri]);

  const onRemoteError = useCallback(() => {
    setPhase((p) => {
      if (p === "primary") return fallbackUri ? "fallback" : "placeholder";
      if (p === "fallback") return "placeholder";
      return p;
    });
  }, [fallbackUri]);

  if (phase === "placeholder" || !source) {
    return (
      <View style={style} {...rest}>
        <View style={placeholderStyles.fillCenter} pointerEvents="none">
          <RNImage
            source={PLACEHOLDER_LOGO}
            style={placeholderStyles.logo}
            resizeMode="contain"
            accessibilityLabel="Game placeholder"
          />
        </View>
      </View>
    );
  }

  return (
    <GameImage
      key={`wide-thumb-${game?.id}-${phase}`}
      recyclingKey={`${game?.id ?? "na"}-${phase}-${primaryUri}`}
      source={source}
      style={style}
      contentFit={contentFit}
      transition={phase === "primary" ? 200 : 0}
      onError={onRemoteError}
      {...rest}
    />
  );
}
