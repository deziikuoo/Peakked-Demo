/**
 * NEXA modals use Reanimated (pinch/pan, springs) for gesture-driven motion per app Reanimated-first convention.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { AnimatedView } from '../../utils/animatedViews';
import { colors } from '../../theme/nexaTokens';
import { spacing } from '../../theme/nexaSpacing';
import { typography } from '../../theme/nexaTypography';
import { sharedStyles } from '../../theme/nexaStyles';
import GameImage from '../GameImage';

function getLogoUriForLink(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.trim());
    const domain = parsed.hostname.replace(/^www\./, '');
    if (!domain) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  } catch {
    return null;
  }
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const springConfig = { damping: 15, stiffness: 150 };

function NexaGameDetailsModal({ game, details, onClose, loading }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showWebsitesModal, setShowWebsitesModal] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const websiteLinks = useMemo(() => {
    if (!details) return [];
    const links = [];
    if (details.website && details.website.trim()) {
      links.push({ name: 'Official website', url: details.website.trim(), slug: 'website' });
    }
    const stores = details.stores || [];
    stores.forEach((s) => {
      if (s.url && s.name) links.push({ name: s.name, url: s.url, slug: s.slug || '' });
    });
    return links;
  }, [details]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = useCallback(() => {
    scale.value = withSpring(1, springConfig);
    savedScale.value = 1;
    translateX.value = withSpring(0, springConfig);
    translateY.value = withSpring(0, springConfig);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  const composed = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onUpdate((e) => {
        'worklet';
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
        scale.value = newScale;
      })
      .onEnd(() => {
        'worklet';
        savedScale.value = scale.value;
        if (scale.value <= MIN_SCALE) {
          scale.value = withSpring(MIN_SCALE, springConfig);
          savedScale.value = MIN_SCALE;
          translateX.value = withSpring(0, springConfig);
          translateY.value = withSpring(0, springConfig);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        }
      });
    const pan = Gesture.Pan()
      .minPointers(1)
      .onUpdate((e) => {
        'worklet';
        if (scale.value > MIN_SCALE) {
          translateX.value = savedTranslateX.value + e.translationX;
          translateY.value = savedTranslateY.value + e.translationY;
        }
      })
      .onEnd(() => {
        'worklet';
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });
    return Gesture.Simultaneous(pinch, pan);
  }, []);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!game) return null;

  const openLink = (url) => {
    if (url) Linking.openURL(url);
  };

  return (
    <>
    <Modal
      visible={!!game}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.contentWrap}>
          <View style={[sharedStyles.glassPanel, styles.content]}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={2}>
                {game.title}
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.secondary} />
              </View>
            ) : details ? (
              <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
              >
                {details.screenshots && details.screenshots.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.screenshotsWrap}
                  >
                    {details.screenshots.map((screenshot, index) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          resetZoom();
                          setSelectedImage(screenshot);
                        }}
                        style={({ pressed }) => [
                          styles.screenshotPressable,
                          pressed && styles.screenshotPressed,
                        ]}
                      >
                        <GameImage
                          source={{ uri: screenshot }}
                          style={styles.screenshotImg}
                        />
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.description}>
                  {details.description || 'No description available.'}
                </Text>

                <View style={styles.infoBlock}>
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
                  <Text style={styles.info}>
                    <Text style={styles.label}>Developers: </Text>
                    {game.developers}
                  </Text>
                  {game.metacritic && game.metacritic !== 'N/A' && (
                    <Text style={styles.info}>
                      <Text style={styles.label}>Metacritic: </Text>
                      {game.metacritic}
                    </Text>
                  )}
                </View>

                {websiteLinks.length > 0 && (
                  <Pressable
                    style={styles.websiteBtn}
                    onPress={() => setShowWebsitesModal(true)}
                  >
                    <Text style={styles.websiteText}>Open Websites</Text>
                  </Pressable>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.noDetails}>No additional details available.</Text>
            )}
          </View>
        </View>
      </View>
    </Modal>

    <Modal
      visible={!!selectedImage}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedImage(null)}
    >
      <Pressable
        style={styles.imageViewerOverlay}
        onPress={() => setSelectedImage(null)}
      >
        <View style={styles.imageViewerContent} pointerEvents="box-none">
          <Pressable
            onPress={() => setSelectedImage(null)}
            style={styles.imageViewerClose}
          >
            <Text style={styles.imageViewerCloseText}>×</Text>
          </Pressable>
          {selectedImage && (
            <GestureDetector gesture={composed}>
              <AnimatedView
                style={[
                  styles.imageViewerImgWrap,
                  {
                    maxWidth: windowWidth,
                    maxHeight: windowHeight - 80,
                  },
                  imageAnimatedStyle,
                ]}
              >
                <GameImage
                  source={{ uri: selectedImage }}
                  style={[
                    styles.imageViewerImg,
                    {
                      width: windowWidth,
                      height: windowHeight - 80,
                    },
                  ]}
                  contentFit="contain"
                />
              </AnimatedView>
            </GestureDetector>
          )}
        </View>
      </Pressable>
    </Modal>

    <Modal
      visible={showWebsitesModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowWebsitesModal(false)}
    >
      <View style={styles.websitesModalOverlay}>
        <View style={styles.websitesModalContent}>
          <View style={styles.websitesModalHeader}>
            <Pressable
              onPress={() => setShowWebsitesModal(false)}
              style={styles.websitesBackBtn}
              hitSlop={12}
            >
              <Text style={styles.websitesBackText}>← Back</Text>
            </Pressable>
            <Text style={styles.websitesModalTitle} numberOfLines={1}>
              Where to buy / Links
            </Text>
            <View style={styles.websitesBackBtn} />
          </View>
          <ScrollView
            style={styles.websitesListScroll}
            contentContainerStyle={styles.websitesListContent}
            showsVerticalScrollIndicator={false}
          >
            {websiteLinks.map((link, index) => {
              const logoUri = getLogoUriForLink(link.url);
              return (
                <Pressable
                  key={`${link.url}-${index}`}
                  style={({ pressed }) => [
                    styles.websiteRow,
                    pressed && styles.websiteRowPressed,
                  ]}
                  onPress={() => openLink(link.url)}
                >
                  {logoUri ? (
                    <GameImage
                      source={{ uri: logoUri }}
                      style={styles.websiteRowLogo}
                      contentFit="contain"
                    />
                  ) : (
                    <View style={styles.websiteRowLogoPlaceholder}>
                      <Text style={styles.websiteRowLogoLetter}>
                        {(link.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.websiteRowTitle} numberOfLines={1}>
                    {link.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  contentWrap: {
    width: '90%',
    maxHeight: '85%',
  },
  content: {
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.spaceMd,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  title: {
    flex: 1,
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textLarge,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.spaceSm,
    marginLeft: spacing.spaceSm,
  },
  closeText: {
    fontSize: 28,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  loadingWrap: {
    padding: spacing.space2xl,
    alignItems: 'center',
  },
  scroll: {
    maxHeight: 400,
  },
  screenshotsWrap: {
    marginVertical: spacing.spaceMd,
  },
  screenshotPressable: {
    marginRight: spacing.spaceSm,
  },
  screenshotPressed: {
    opacity: 0.8,
  },
  screenshotImg: {
    width: 200,
    height: 120,
    borderRadius: 8,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 48,
    right: spacing.spaceMd,
    zIndex: 1,
    padding: spacing.spaceSm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    minWidth: 44,
    alignItems: 'center',
  },
  imageViewerCloseText: {
    fontSize: 28,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  imageViewerImgWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImg: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textBase,
    color: colors.textSecondary,
    padding: spacing.spaceMd,
    lineHeight: 22,
  },
  infoBlock: {
    paddingHorizontal: spacing.spaceMd,
    paddingBottom: spacing.spaceMd,
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
  websiteBtn: {
    margin: spacing.spaceMd,
    paddingVertical: spacing.spaceSm,
    paddingHorizontal: spacing.spaceLg,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  websiteText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textBase,
    color: colors.background,
  },
  noDetails: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textBase,
    color: colors.textSecondary,
    padding: spacing.spaceMd,
  },
  websitesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  websitesModalContent: {
    backgroundColor: colors.bgPanel,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    minHeight: 200,
  },
  websitesModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.spaceMd,
    paddingVertical: spacing.spaceSm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  websitesBackBtn: {
    padding: spacing.spaceSm,
    minWidth: 72,
  },
  websitesBackText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textBase,
    color: colors.secondary,
  },
  websitesModalTitle: {
    flex: 1,
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.textMedium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  websitesListScroll: {
    maxHeight: 400,
  },
  websitesListContent: {
    padding: spacing.spaceMd,
    paddingBottom: spacing.space2xl,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.spaceMd,
    paddingHorizontal: spacing.spaceSm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  websiteRowPressed: {
    opacity: 0.7,
  },
  websiteRowLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: spacing.spaceMd,
  },
  websiteRowLogoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: spacing.spaceMd,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  websiteRowLogoLetter: {
    fontFamily: typography.fontBodyBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  websiteRowTitle: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.textBase,
    color: colors.textPrimary,
  },
});

export default NexaGameDetailsModal;
