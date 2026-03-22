import { Dimensions } from 'react-native';
import { spacing } from './nexaSpacing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function scaleByWidth(value) {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(value * Math.min(Math.max(scale, 0.85), 1.25));
}

export function scaleByHeight(value) {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(value * Math.min(Math.max(scale, 0.85), 1.25));
}

export function getHorizontalPadding() {
  return Math.max(spacing.spaceMd, scaleByWidth(spacing.spaceMd));
}

export function getTopContentPadding() {
  return scaleByHeight(spacing.spaceMd);
}

export function getBottomContentPadding() {
  return scaleByHeight(spacing.space2xl);
}

export default {
  scaleByWidth,
  scaleByHeight,
  getHorizontalPadding,
  getTopContentPadding,
  getBottomContentPadding,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
