import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AnimatedView } from '../utils/animatedViews';
import { useSafeAreaInsets } from '../utils/safeArea';
import { themes } from '../theme/colors';

const colors = themes.darkNeon;
const PERSIST_MS = 3000;
const FADE_OUT_MS = 400;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  accent: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default function SplashScreen({ onFadeComplete }) {
  const opacity = useSharedValue(1);
  const insets = useSafeAreaInsets();
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
        if (finished && onFadeComplete) runOnJS(onFadeComplete)();
      });
    }, PERSIST_MS);
    return () => clearTimeout(timer);
  }, [opacity, onFadeComplete]);

  return (
    <AnimatedView style={[styles.container, { paddingTop: insets.top }, animatedStyle]}>
      <Text style={styles.title}>
        Game<Text style={styles.accent}>Trend</Text>
      </Text>
      <Text style={styles.tagline}>Live player counts, streams, and ratings</Text>
    </AnimatedView>
  );
}
