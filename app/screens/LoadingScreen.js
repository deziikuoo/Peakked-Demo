import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from '../utils/safeArea';
import { themes } from '../theme/colors';

const colors = themes.darkNeon;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 48,
    paddingHorizontal: 40,
    alignItems: 'center',
    minWidth: 280,
    boxShadow: `0px 8px 24px ${colors.secondary}14`,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 4,
  },
  accent: {
    color: colors.primary,
  },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 8,
  },
});

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.card}>
        <Text style={styles.title}>
          PEAK<Text style={styles.accent}>KED</Text>
        </Text>
        <Text style={styles.tagline}>Power the charts.</Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.spinner}
        />
      </View>
    </View>
  );
}
