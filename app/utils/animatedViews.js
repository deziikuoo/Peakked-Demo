/**
 * Explicit Reanimated-wrapped views for use with useAnimatedStyle().
 * Use these instead of Animated.View when applying animated styles to avoid
 * "animated style to non-animated component" errors (e.g. on web or inside navigators).
 */
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

export const AnimatedView = Animated.createAnimatedComponent(View);
