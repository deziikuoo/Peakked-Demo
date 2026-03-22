import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EVENT_TYPES } from '../data/shared/gameFormatters';

export const MARKER_SIZE = 24;
const ICON_SIZE = 16;

/** Returns [[x,y], ...] for each marker (with nudge). Used by SparklineScrubbable for hit testing. */
export function getMarkerCenters(events = [], points = []) {
  if (!points.length) return [];
  const lastIndex = points.length - 1;
  const byHour = new Map();
  return events
    .filter((e) => e.hourIndex >= 0 && e.hourIndex <= lastIndex)
    .map((event) => {
      const pt = points[event.hourIndex];
      if (!pt) return null;
      const [x, y] = pt;
      const key = event.hourIndex;
      let offsetY = 0;
      if (byHour.has(key)) {
        const count = byHour.get(key);
        byHour.set(key, count + 1);
        offsetY = -(count * (MARKER_SIZE + 2));
      } else {
        byHour.set(key, 1);
      }
      return [x, y + offsetY];
    })
    .filter(Boolean);
}

/** Hex color with alpha (0–1). */
function withAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = Math.round(alpha * 255);
  return `rgba(${r},${g},${b},${a / 255})`;
}

/**
 * Overlay of icon dots at event hour positions on the sparkline.
 * Renders below scrub dot, above sparkline. Optional nudge for overlapping markers.
 */
export default function EventMarkers({ events = [], points = [], width, height, scrubPosition = null, onMarkerPress }) {
  const markersWithPosition = useMemo(() => {
    if (!points.length) return [];
    const lastIndex = points.length - 1;
    const byHour = new Map();
    return events
      .filter((e) => e.hourIndex >= 0 && e.hourIndex <= lastIndex)
      .map((event) => {
        const pt = points[event.hourIndex];
        if (!pt) return null;
        const [x, y] = pt;
        const key = event.hourIndex;
        let offsetY = 0;
        if (byHour.has(key)) {
          const count = byHour.get(key);
          byHour.set(key, count + 1);
          offsetY = -(count * (MARKER_SIZE + 2));
        } else {
          byHour.set(key, 1);
        }
        const config = EVENT_TYPES[event.type] || EVENT_TYPES.update;
        return {
          event,
          x,
          y: y + offsetY,
          ...config,
        };
      })
      .filter(Boolean);
  }, [events, points]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        marker: {
          position: 'absolute',
          width: MARKER_SIZE,
          height: MARKER_SIZE,
          borderRadius: MARKER_SIZE / 2,
          borderWidth: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    []
  );

  if (markersWithPosition.length === 0) return null;

  return (
    <>
      {markersWithPosition.map(({ event, x, y, icon, color }, idx) => {
        const isNearScrub =
          scrubPosition != null && Math.abs(event.hourIndex - scrubPosition) <= 0.5;
        const scale = isNearScrub ? 1.3 : 1;
        const bgColor = withAlpha(color, 0.25);
        return (
          <View
            key={`${event.hourIndex}-${event.type}-${idx}`}
            style={[
              styles.marker,
              {
                left: x - MARKER_SIZE / 2,
                top: y - MARKER_SIZE / 2,
                backgroundColor: bgColor,
                borderColor: color,
                transform: [{ scale }],
              },
            ]}
            accessible
            accessibilityLabel={event.label}
            accessibilityRole="none"
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => onMarkerPress?.(event)}
          >
            <Ionicons name={icon} size={ICON_SIZE} color={color} />
          </View>
        );
      })}
    </>
  );
}
