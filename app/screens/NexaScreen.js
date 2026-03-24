import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/nexaTokens';
import { spacing } from '../theme/nexaSpacing';
import { typography } from '../theme/nexaTypography';
import { getHorizontalPadding, getTopContentPadding } from '../theme/nexaLayout';
import { gameService } from '../services/api/nexaApi';
import { DEMO_MODE } from '../config/demoMode';
import NexaGameRecommender from '../components/nexa/NexaGameRecommender';
import NexaGameDetailsModal from '../components/nexa/NexaGameDetailsModal';

export default function NexaScreen() {
  const insets = useSafeAreaInsets();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [error, setError] = useState(null);
  const [explain, setExplain] = useState('');
  const [filters, setFilters] = useState({});
  const [aiDown, setAiDown] = useState(false);
  const [aiDownMessage, setAiDownMessage] = useState('');

  const handleGetRecommendations = useCallback(async (preference, sortBy, filtersArg) => {
    setLoading(true);
    setError(null);
    setAiDown(false);
    setAiDownMessage('');
    try {
      const result = await gameService.getRecommendations(
        preference,
        sortBy,
        filtersArg || filters
      );
      setGames(Array.isArray(result.games) ? result.games : []);
      setExplain(result.explain || '');
      if (result.ai_down) {
        setAiDown(true);
        setAiDownMessage(
          result.message ||
            "Our AI-powered recommendations are temporarily unavailable. Here's an example of what you would see if the service was live."
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to get recommendations. Please try again.');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleViewDetails = useCallback(async (game) => {
    setSelectedGame(game);
    setLoading(true);
    setError(null);
    try {
      const details = await gameService.getGameDetails(game.title);
      setGameDetails(details);
    } catch (err) {
      setError(err.message || 'Failed to get game details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGame(null);
    setGameDetails(null);
  }, []);

  const containerPadding = useMemo(
    () => ({
      paddingTop: insets.top + getTopContentPadding(),
      paddingBottom: insets.bottom,
      paddingHorizontal: Math.max(insets.left, insets.right, getHorizontalPadding()),
    }),
    [insets.top, insets.bottom, insets.left, insets.right]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.content, containerPadding]}>
        <View style={styles.header}>
          <MaskedView
            maskElement={
              <Text style={[styles.title, styles.titleFontForce]} allowFontScaling={false}>NEXA</Text>
            }
          >
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.titleGradient}
            >
              <Text style={[styles.title, { opacity: 0 }, styles.titleFontForce]} allowFontScaling={false}>NEXA</Text>
            </LinearGradient>
          </MaskedView>
          <Text style={[styles.subtitle, styles.bodyFontForce]} allowFontScaling={false}>
            {DEMO_MODE
              ? 'Offline demo — curated games with realistic stats & Steam artwork (no server).'
              : 'Discover your next favorite game with our advanced AI!'}
          </Text>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.06)', 'rgba(26, 255, 26, 0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Text style={[styles.badgeText, styles.bodyFontForce]} allowFontScaling={false}>
              {DEMO_MODE
                ? '📱 Frontend demo · set EXPO_PUBLIC_DEMO_MODE=false for live API'
                : '🧠 Powered by GPT-4o AI Gaming Expert'}
            </Text>
          </LinearGradient>
        </View>

        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <NexaGameRecommender
          onGetRecommendations={handleGetRecommendations}
          games={games}
          loading={loading}
          onViewDetails={handleViewDetails}
          error={null}
          explain={explain}
          filters={filters}
          setFilters={setFilters}
          aiDown={aiDown}
          aiDownMessage={aiDownMessage}
        />

        {selectedGame ? (
          <NexaGameDetailsModal
            game={selectedGame}
            details={gameDetails}
            onClose={handleCloseModal}
            loading={loading}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.spaceMd,
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontDisplayBlack,
    fontSize: typography.sizes.textMega,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 5,
    marginBottom: spacing.spaceSm,
    textTransform: 'uppercase',
    ...(Platform.OS === 'web'
      ? { textShadow: `0 0 40px ${colors.secondary}80` }
      : {
          textShadowColor: 'rgba(0, 194, 255, 0.45)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 40,
        }),
  },
  titleFontForce: { fontFamily: typography.fontDisplayBlack },
  bodyFontForce: { fontFamily: typography.fontBody },
  titleGradient: {},
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.spaceMd,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.spaceSm,
    paddingHorizontal: spacing.spaceLg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 50,
    overflow: 'hidden',
  },
  badgeText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  errorWrap: {
    marginHorizontal: spacing.spaceMd,
    marginBottom: spacing.spaceMd,
    padding: spacing.spaceMd,
    backgroundColor: colors.error + '20',
    borderRadius: 8,
  },
  errorText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textBase,
    color: colors.error,
  },
});
