import { useEffect, useState, useMemo, useCallback } from "react";
import { View, Image as RNImage, StyleSheet } from "react-native";
import GameImage from "./GameImage";
import {
  getGameListThumbnailFallbackUri,
  getGameListThumbnailUri,
} from "../data/shared/gameFormatters";

/** Final fallback when remote Steam / thumbnail URLs fail */
const PLACEHOLDER_LOGO = require("../assets/Logos/image logo WO BG.png");

const placeholderStyles = StyleSheet.create({
  fillCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  /** Larger in the strip: scale up from center (strip clips overflow) */
  logo: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 2.05 }],
  },
});

/**
 * Row / list slot: Steam library portrait (600×900) → `game.thumbnail` (header) → app logo.
 *
 * Placeholder uses RN `Image` (not expo-image): local assets + error-state swaps are more
 * reliable on iOS/Android; expo-image can mishandle switching to a `require()` source after `onError`.
 */
export default function GameListThumbnailImage({
  game,
  style,
  contentFit = "cover",
  ...rest
}) {
  const primaryUri = useMemo(
    () => getGameListThumbnailUri(game),
    [game?.id, game?.thumbnail]
  );
  const fallbackUri = useMemo(
    () => getGameListThumbnailFallbackUri(game),
    [game?.id, game?.thumbnail]
  );

  /** 'primary' | 'fallback' | 'placeholder' */
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
      key={`list-thumb-${game?.id}-${phase}`}
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
