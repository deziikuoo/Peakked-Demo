import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../theme/nexaTokens';
import { spacing } from '../../theme/nexaSpacing';
import { typography } from '../../theme/nexaTypography';
import { sharedStyles } from '../../theme/nexaStyles';
import GameWideThumbnailImage from '../GameWideThumbnailImage';

function NexaGameCard({ game, onViewDetails }) {
  const formatViewerCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return String(count ?? 0);
  };

  return (
    <View style={[sharedStyles.glassPanel, styles.card]}>
      <View style={styles.imageContainer}>
        <GameWideThumbnailImage game={game} style={styles.image} />
        {game.metacritic && game.metacritic !== 'N/A' && (
          <View style={styles.metacriticBadge}>
            <Text style={styles.metacriticText}>{game.metacritic}</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {game.title}
        </Text>
        {game.twitch_viewers > 0 && (
          <Text style={styles.viewers}>
            {formatViewerCount(game.twitch_viewers)} watching
          </Text>
        )}
        <Text style={styles.info}>
          <Text style={styles.label}>Released: </Text>
          {game.release_date}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>Platforms: </Text>
          {game.platforms}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>Rating: </Text>
          {game.rating}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>Genres: </Text>
          {game.genres}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onViewDetails}
        >
          <Text style={styles.buttonText}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.spaceMd,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  metacriticBadge: {
    position: 'absolute',
    top: spacing.spaceSm,
    right: spacing.spaceSm,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.spaceSm,
    paddingVertical: spacing.spaceXs,
    borderRadius: 4,
  },
  metacriticText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textSmall,
    color: colors.background,
  },
  content: {
    padding: spacing.spaceMd,
  },
  title: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textMedium,
    color: colors.textPrimary,
    marginBottom: spacing.spaceSm,
  },
  viewers: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    color: colors.secondary,
    marginBottom: spacing.spaceXs,
  },
  info: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textSmall,
    color: colors.textSecondary,
    marginBottom: spacing.spaceXs,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: typography.fontBodyBold,
  },
  button: {
    marginTop: spacing.spaceMd,
    paddingVertical: spacing.spaceSm,
    paddingHorizontal: spacing.spaceLg,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textBase,
    color: colors.textPrimary,
  },
});

export default NexaGameCard;
