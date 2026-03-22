import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/nexaTokens';
import NexaParticlesBackground from './nexa/NexaParticlesBackground';

/**
 * Shared app background (gradient + particles). Rendered once behind the tab navigator
 * so every tab shows the same background.
 */
export default function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" collapsable={false}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
      {/* Particle background commented out for performance check; gradients disabled, bg solid black
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgVoid }]} />
      <LinearGradient
        colors={['rgba(255, 107, 53, 0.05)', 'rgba(255, 107, 53, 0.02)', 'transparent']}
        locations={[0, 0.3, 0.6]}
        style={[StyleSheet.absoluteFill, { height: '50%' }]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0, 194, 255, 0.02)', 'rgba(0, 194, 255, 0.04)']}
        locations={[0.4, 0.7, 1]}
        style={[StyleSheet.absoluteFill, { top: '50%', height: '50%' }]}
      />
      <NexaParticlesBackground />
      */}
    </View>
  );
}
