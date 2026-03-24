import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Shared app background. Liquid gradient disabled (solid black) for stability testing.
 */
export default function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" collapsable={false}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
    </View>
  );
}
