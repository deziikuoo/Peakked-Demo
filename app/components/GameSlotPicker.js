import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { AnimatedView } from "../utils/animatedViews";
import { Ionicons } from "@expo/vector-icons";
import { themes } from "../theme/colors";
import { formatPlayerCount, getTrend } from "../data/shared/gameFormatters";
import TrendBadge from "./TrendBadge";
import GameImage from "./GameImage";

const colors = themes.darkNeon;

const SLOT_COLORS = [colors.primary, colors.secondary, colors.success];

const localStyles = StyleSheet.create({
  slot: {
    width: "100%",
    flex: 1,
    minWidth: 110,
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
  },
  slotEmpty: {
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: `${colors.surface}99`,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  slotFilled: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}22`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  addLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  thumbWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.border,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  filledBody: {
    padding: 6,
  },
  filledName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  filledStat: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});

function PulsingGlow({ color, style }) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: color,
    opacity: opacity.value,
  }));
  return (
    <AnimatedView
      style={[style, animatedStyle]}
      pointerEvents="none"
    />
  );
}

export default function GameSlotPicker({
  slotIndex,
  game,
  onAdd,
  onRemove,
}) {
  const slotColor = SLOT_COLORS[slotIndex] ?? colors.primary;

  if (!game) {
    return (
      <Pressable
        style={({ pressed }) => [
          localStyles.slot,
          localStyles.slotEmpty,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => onAdd?.(slotIndex)}
        accessibilityRole="button"
        accessibilityLabel={`Add game to slot ${slotIndex + 1}`}
      >
        <PulsingGlow
          color={slotColor}
          style={{ top: -2, left: -2, right: -2, bottom: -2 }}
        />
        <View style={[localStyles.addIconWrap, { borderColor: `${slotColor}44` }]}>
          <Ionicons name="add" size={20} color={slotColor} />
        </View>
        <Text style={localStyles.addLabel}>Add game</Text>
      </Pressable>
    );
  }

  const trend = game.history ? getTrend(game.history) : { direction: "stable", percentChange: 0 };

  return (
    <View style={[localStyles.slot, localStyles.slotFilled, { borderColor: `${slotColor}88` }]}>
      <Pressable
        style={localStyles.removeBtn}
        onPress={() => onRemove?.(slotIndex)}
        accessibilityLabel={`Remove ${game.name} from comparison`}
      >
        <Ionicons name="close" size={14} color="#FFF" />
      </Pressable>
      <View style={localStyles.thumbWrap}>
        <GameImage
          source={{ uri: game.thumbnail }}
          style={localStyles.thumbImage}
        />
      </View>
      <View style={localStyles.filledBody}>
        <Text style={localStyles.filledName} numberOfLines={2}>
          {game.name}
        </Text>
        <Text style={localStyles.filledStat}>
          {formatPlayerCount(game.playerCount)} players
        </Text>
        <View style={localStyles.badgeRow}>
          <TrendBadge direction={trend.direction} percentChange={trend.percentChange} />
        </View>
      </View>
    </View>
  );
}
