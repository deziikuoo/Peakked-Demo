import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Line,
  Group,
  useCanvasSize,
} from '@shopify/react-native-skia';
import { useSharedValue, useFrameCallback } from 'react-native-reanimated';

const CONNECTION_DISTANCE = 150;
const CONNECTION_OPACITY_MAX = 0.1;
const TOUCH_RADIUS = 100;
const TOUCH_FORCE = 0.03;
const GLOW_LAYERS = [
  { radiusAdd: 28, opacityMult: 0.015 },
  { radiusAdd: 24, opacityMult: 0.02 },
  { radiusAdd: 21, opacityMult: 0.03 },
  { radiusAdd: 18, opacityMult: 0.04 },
  { radiusAdd: 15, opacityMult: 0.06 },
  { radiusAdd: 12, opacityMult: 0.08 },
  { radiusAdd: 10, opacityMult: 0.10 },
  { radiusAdd: 8, opacityMult: 0.13 },
  { radiusAdd: 6, opacityMult: 0.17 },
  { radiusAdd: 5, opacityMult: 0.22 },
  { radiusAdd: 4, opacityMult: 0.26 },
  { radiusAdd: 3, opacityMult: 0.30 },
  { radiusAdd: 2, opacityMult: 0.35 },
];
const COLORS = ['#FF6B35', '#00C2FF'];
const MOBILE_BREAKPOINT = 768;

function createParticles(width, height, particleCount) {
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25,
      size: Math.random() * 2.5 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.5 + 0.2,
    });
  }
  return particles;
}

function ParticleDot({ index, particlesShared, initialParticlesRef }) {
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);

  useFrameCallback(() => {
    'worklet';
    const particles = particlesShared.value;
    if (particles.length <= index) return;
    const p = particles[index];
    if (p) {
      cx.value = p.x;
      cy.value = p.y;
    }
  });

  const initial = initialParticlesRef.current;
  if (!initial || initial.length <= index) return null;
  const p = initial[index];
  if (!p) return null;

  return (
    <Group>
      {GLOW_LAYERS.map((layer, idx) => (
        <Circle
          key={idx}
          cx={cx}
          cy={cy}
          r={p.size + layer.radiusAdd}
          color={p.color}
          opacity={p.opacity * layer.opacityMult}
        />
      ))}
      <Circle cx={cx} cy={cy} r={p.size} color={p.color} opacity={p.opacity * 0.6} />
    </Group>
  );
}

function ConnectionLine({ index, particlesShared }) {
  const p1 = useSharedValue({ x: 0, y: 0 });
  const p2 = useSharedValue({ x: 0, y: 0 });
  const opacity = useSharedValue(0);
  const color = useSharedValue(COLORS[0]);

  useFrameCallback(() => {
    'worklet';
    const particles = particlesShared.value;
    const segments = [];
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < CONNECTION_DISTANCE) {
          segments.push({
            p1: { x: particles[i].x, y: particles[i].y },
            p2: { x: particles[j].x, y: particles[j].y },
            opacity: (1 - distance / CONNECTION_DISTANCE) * CONNECTION_OPACITY_MAX,
            color: particles[i].color,
          });
        }
      }
    }
    const seg = segments[index];
    if (seg) {
      p1.value = seg.p1;
      p2.value = seg.p2;
      opacity.value = seg.opacity;
      color.value = seg.color;
    } else {
      opacity.value = 0;
    }
  });

  return (
    <Line
      p1={p1}
      p2={p2}
      color={color}
      opacity={opacity}
      style="stroke"
      strokeWidth={1}
    />
  );
}

export default function NexaParticlesBackground() {
  const { width: windowWidth } = useWindowDimensions();
  const particleCountForLayout = windowWidth < MOBILE_BREAKPOINT ? 13 : 33;
  const particleCountRef = useRef(null);
  const particleCount = particleCountRef.current ?? particleCountForLayout;
  if (particleCountRef.current === null) particleCountRef.current = particleCountForLayout;

  const sizeShared = useSharedValue({ width: 0, height: 0 });
  const particlesShared = useSharedValue([]);
  const initialParticlesRef = useRef([]);
  const touchShared = useSharedValue({ x: -1e6, y: -1e6 });
  const [ready, setReady] = useState(false);
  const { ref: canvasRef, size } = useCanvasSize();

  useEffect(() => {
    if (size.width > 0 && size.height > 0 && !ready) {
      const created = createParticles(size.width, size.height, particleCount);
      particlesShared.value = created;
      initialParticlesRef.current = created;
      setReady(true);
    }
  }, [size.width, size.height, ready, particleCount, particlesShared]);

  useFrameCallback(() => {
    'worklet';
    const size = sizeShared.value;
    if (size.width <= 0 || size.height <= 0) return;

    const particles = particlesShared.value;
    const touch = touchShared.value;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      const dx = touch.x - p.x;
      const dy = touch.y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < TOUCH_RADIUS && distance > 0) {
        const force = (TOUCH_RADIUS - distance) / TOUCH_RADIUS;
        p.x -= dx * force * TOUCH_FORCE;
        p.y -= dy * force * TOUCH_FORCE;
      }

      if (p.x > size.width) p.x = 0;
      if (p.x < 0) p.x = size.width;
      if (p.y > size.height) p.y = 0;
      if (p.y < 0) p.y = size.height;
    }
  });

  const handleTouchStart = useCallback((evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    touchShared.value = { x: locationX, y: locationY };
  }, [touchShared]);

  const handleTouchMove = useCallback((evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    touchShared.value = { x: locationX, y: locationY };
  }, [touchShared]);

  const handleTouchEnd = useCallback(() => {
    touchShared.value = { x: -1e6, y: -1e6 };
  }, [touchShared]);

  const maxConnections = Math.min(200, (particleCount * (particleCount - 1)) / 2);
  const connectionIndices = Array.from({ length: maxConnections }, (_, i) => i);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Canvas
        ref={canvasRef}
        style={StyleSheet.absoluteFill}
        onSize={sizeShared}
      >
        {connectionIndices.map((i) => (
          <ConnectionLine key={`line-${i}`} index={i} particlesShared={particlesShared} />
        ))}
        {Array.from({ length: particleCount }, (_, i) => (
          <ParticleDot
            key={`particle-${i}`}
            index={i}
            particlesShared={particlesShared}
            initialParticlesRef={initialParticlesRef}
          />
        ))}
      </Canvas>
      <View
        style={StyleSheet.absoluteFill}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        pointerEvents="box-none"
      />
    </View>
  );
}
