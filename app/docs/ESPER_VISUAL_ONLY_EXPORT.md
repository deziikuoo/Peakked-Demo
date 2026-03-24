# Esper Visual Only Export

This file contains only the **visual Esper character model** extracted from this project.

Excluded on purpose:
- Chat logic
- TTS / audio
- Floating text / messages
- App phase hooks
- Dashboard integration
- History / sessions
- Voice preferences
- Backend APIs

Dependencies for the visual component:
- `react`

Optional dependency:
- `framer-motion` if you want the small entry fade/scale effect from the original app

---

## 1. What This Is

This is the minimum portable version of Esper's visual model:
- main orb body
- animated inner lava/glow
- blinking / looking eyes via pseudo-elements
- startup animation
- idle float animation
- optional teaching color variants
- optional wave ring effect

---

## 2. Visual Component Logic (`EsperVisual.tsx`)

```tsx
import { useEffect, useMemo, useState } from 'react';

import './esper-visual.css';

type EsperMode =
  | 'general'
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'cultural';

interface EsperVisualProps {
  mode?: EsperMode;
  className?: string;
  showWaves?: boolean;
  playStartup?: boolean;
  size?: number | string;
}

const WAVE_DATA = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  intensity: Math.random() * 8 + 1,
  delay: Math.random() * 0.25,
}));

export function EsperVisual({
  mode = 'general',
  className = '',
  showWaves = false,
  playStartup = true,
  size,
}: EsperVisualProps) {
  const [isStartup, setIsStartup] = useState(playStartup);

  useEffect(() => {
    if (!playStartup) return;

    const timer = window.setTimeout(() => {
      setIsStartup(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [playStartup]);

  const sphereClassName = useMemo(() => {
    const classes = ['esper-ai-sphere'];

    if (isStartup) classes.push('startup');
    if (mode !== 'general') {
      classes.push('teaching-mode', `teaching-${mode}`);
    }

    return classes.join(' ');
  }, [isStartup, mode]);

  const lavaClassName = useMemo(() => {
    const classes = ['esper-lava'];

    if (isStartup) classes.push('startup');
    if (mode !== 'general') {
      classes.push('teaching-mode', `teaching-${mode}`);
    }

    return classes.join(' ');
  }, [isStartup, mode]);

  return (
    <div
      className={`esper-visual-root ${className}`.trim()}
      style={
        size
          ? ({
              '--esper-size': typeof size === 'number' ? `${size}px` : size,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="esper-container">
        <div className="esper-content-wrapper">
          <div className={sphereClassName}>
            <div className={lavaClassName} />
          </div>

          {showWaves && (
            <div className="esper-wave-container" aria-hidden="true">
              {WAVE_DATA.map((wave) => (
                <div
                  key={wave.id}
                  className="esper-wave"
                  style={
                    {
                      '--i': wave.intensity,
                      animationDelay: `-${wave.delay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Visual Styles Only (`esper-visual.css`)

```css
:root {
  --esper-size: 700px;
  --esper-grammar-color: rgba(59, 130, 246, 0.3);
  --esper-vocabulary-color: rgba(34, 197, 94, 0.3);
  --esper-pronunciation-color: rgba(249, 115, 22, 0.3);
  --esper-cultural-color: rgba(147, 51, 234, 0.3);

  --esper-lava-size: 760px;
  --esper-eye-width: 40px;
  --esper-eye-height: 120px;
  --esper-eye-spacing: 120px;
  --esper-eye-radius: 10.4px;
  --esper-glow-size: 240px;
  --esper-shadow-size: 200px;
  --esper-inner-glow: 160px;
  --esper-bottom-shadow: 200px;
  --esper-hover-blur: 80px;
  --esper-lava-blur: 93.6px;
  --esper-lava-blur-before: 32px;
  --esper-lava-blur-after: 48px;
  --esper-wave-container-width: 1200px;
  --esper-wave-container-height: 240px;
  --esper-wave-gap: 10.4px;
  --esper-wave-width: 8px;
  --esper-wave-height: 80px;
  --esper-wave-radius: 8px;
  --esper-float-distance: 40px;
  --esper-wave-base-height: 21.6px;
  --esper-wave-peak-height: 58.4px;
  --esper-wave-increment: 8px;
  --esper-wave-peak-increment: 10.4px;
  --esper-blink-height: 120px;
  --esper-blink-closed: 10.4px;
}

.esper-visual-root {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 100vh;
}

.esper-container {
  position: relative;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.esper-content-wrapper {
  position: relative;
  width: var(--esper-size);
  height: var(--esper-size);
  display: flex;
  align-items: center;
  justify-content: center;
}

.esper-ai-sphere {
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 100%;
  transform: translate3d(-50%, -50%, 0);
  width: var(--esper-size);
  height: var(--esper-size);
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(5px);
  box-shadow:
    0 0 var(--esper-shadow-size) 15px rgba(0, 0, 0, 0.5),
    inset 0 0 var(--esper-inner-glow) rgba(255, 255, 255, 0.5),
    inset 0 calc(var(--esper-bottom-shadow) * -0.5)
      var(--esper-bottom-shadow) rgba(0, 0, 0, 0.2);
  z-index: 50;
  overflow: hidden;
  transition: transform 0.3s ease-in-out;
  animation: esperFloat 6s ease-in-out infinite;
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
  contain: layout style paint;
}

.esper-ai-sphere:hover {
  transform: translate3d(-50%, -50%, 0) scale(1.05);
}

.esper-ai-sphere:hover .esper-lava {
  filter: blur(var(--esper-hover-blur));
}

.esper-ai-sphere:hover .esper-lava::before,
.esper-ai-sphere:hover .esper-lava::after {
  animation-duration: 3s;
}

.esper-ai-sphere::before {
  content: '';
  position: absolute;
  top: 45%;
  left: 47%;
  transform: translate3d(-50%, -50%, 0);
  width: var(--esper-eye-width);
  height: var(--esper-eye-height);
  background: rgba(255, 255, 255, 1);
  border-radius: var(--esper-eye-radius);
  box-shadow: var(--esper-eye-spacing) 0 0 rgba(255, 255, 255, 1);
  z-index: 60;
  animation:
    esperBlink 4s infinite,
    esperLookAround 10s infinite ease-in-out;
  will-change: transform, box-shadow;
  backface-visibility: hidden;
}

.esper-ai-sphere::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 var(--esper-glow-size) rgba(255, 255, 255, 0.1);
  animation: esperGlowPulse 2s ease-in-out infinite;
  will-change: box-shadow;
  backface-visibility: hidden;
}

.esper-lava {
  filter: blur(var(--esper-lava-blur));
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  border-radius: 100%;
  transform: translate3d(-50%, -50%, 0);
  width: var(--esper-lava-size);
  height: var(--esper-lava-size);
  z-index: 10;
  opacity: 1;
  mix-blend-mode: screen;
  animation: esperColorShift 20s infinite linear;
  will-change: transform, filter;
  backface-visibility: hidden;
  contain: layout style paint;
}

.esper-lava::before {
  content: '';
  position: absolute;
  width: 120%;
  height: 120%;
  background:
    radial-gradient(circle at 30% 30%, #0066ff 0%, transparent 45%),
    radial-gradient(circle at 70% 30%, #ff00cc 0%, transparent 45%),
    radial-gradient(circle at 50% 60%, #00ff99 0%, transparent 45%),
    radial-gradient(circle at 80% 40%, #ff3300 0%, transparent 45%);
  filter: blur(var(--esper-lava-blur-before));
  opacity: 1;
  mix-blend-mode: screen;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.esper-lava::after {
  content: '';
  position: absolute;
  width: 120%;
  height: 120%;
  background:
    radial-gradient(circle at 40% 40%, #0066ff 0%, transparent 35%),
    radial-gradient(circle at 60% 40%, #ff00cc 0%, transparent 35%),
    radial-gradient(circle at 50% 70%, #00ff99 0%, transparent 35%),
    radial-gradient(circle at 70% 50%, #ff3300 0%, transparent 35%);
  filter: blur(var(--esper-lava-blur-after));
  opacity: 1;
  mix-blend-mode: screen;
  animation: esperPulse 4s ease-in-out infinite alternate;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.esper-ai-sphere.startup {
  animation: esperStartupSphere 2s ease-out;
  opacity: 0;
  animation-fill-mode: forwards;
}

.esper-lava.startup {
  animation: esperStartupLava 2s ease-out;
  opacity: 0;
  animation-fill-mode: forwards;
}

.esper-wave-container {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  width: var(--esper-wave-container-width);
  height: var(--esper-wave-container-height);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--esper-wave-gap);
  will-change: transform;
  backface-visibility: hidden;
}

.esper-wave {
  width: var(--esper-wave-width);
  height: var(--esper-wave-height);
  background: rgba(255, 20, 147, 0.8);
  animation: esperWave 0.5s ease-in-out infinite;
  border-radius: var(--esper-wave-radius);
  will-change: height, background;
  backface-visibility: hidden;
  contain: layout style paint;
}

.esper-ai-sphere.teaching-mode {
  transform: translate3d(-50%, -50%, 0) scale(1.1);
  filter: brightness(1.2);
  transition: all 0.5s ease-in-out;
}

.esper-ai-sphere.teaching-grammar {
  box-shadow:
    0 0 var(--esper-shadow-size) 15px var(--esper-grammar-color),
    inset 0 0 var(--esper-inner-glow) var(--esper-grammar-color),
    inset 0 calc(var(--esper-bottom-shadow) * -0.5)
      var(--esper-bottom-shadow) var(--esper-grammar-color);
}

.esper-lava.teaching-grammar {
  filter: blur(var(--esper-lava-blur)) hue-rotate(200deg);
}

.esper-ai-sphere.teaching-vocabulary {
  box-shadow:
    0 0 var(--esper-shadow-size) 15px var(--esper-vocabulary-color),
    inset 0 0 var(--esper-inner-glow) var(--esper-vocabulary-color),
    inset 0 calc(var(--esper-bottom-shadow) * -0.5)
      var(--esper-bottom-shadow) var(--esper-vocabulary-color);
}

.esper-lava.teaching-vocabulary {
  filter: blur(var(--esper-lava-blur)) hue-rotate(120deg);
}

.esper-ai-sphere.teaching-pronunciation {
  box-shadow:
    0 0 var(--esper-shadow-size) 15px var(--esper-pronunciation-color),
    inset 0 0 var(--esper-inner-glow) var(--esper-pronunciation-color),
    inset 0 calc(var(--esper-bottom-shadow) * -0.5)
      var(--esper-bottom-shadow) var(--esper-pronunciation-color);
}

.esper-lava.teaching-pronunciation {
  filter: blur(var(--esper-lava-blur)) hue-rotate(30deg);
}

.esper-ai-sphere.teaching-cultural {
  box-shadow:
    0 0 var(--esper-shadow-size) 15px var(--esper-cultural-color),
    inset 0 0 var(--esper-inner-glow) var(--esper-cultural-color),
    inset 0 calc(var(--esper-bottom-shadow) * -0.5)
      var(--esper-bottom-shadow) var(--esper-cultural-color);
}

.esper-lava.teaching-cultural {
  filter: blur(var(--esper-lava-blur)) hue-rotate(280deg);
}

@keyframes esperWave {
  0%,
  100% {
    height: calc(var(--esper-wave-base-height) + (var(--i) * var(--esper-wave-increment)));
    background: rgba(255, 20, 147, 0.4);
  }

  50% {
    height: calc(var(--esper-wave-peak-height) + (var(--i) * var(--esper-wave-peak-increment)));
    background: rgba(255, 20, 147, 1);
  }
}

@keyframes esperStartupSphere {
  0% {
    opacity: 0;
    transform: translate3d(-50%, -50%, 0) scale(0.1);
    filter: brightness(0);
  }

  50% {
    opacity: 0.5;
    transform: translate3d(-50%, -50%, 0) scale(0.6);
    filter: brightness(0.5);
  }

  100% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1);
    filter: brightness(1);
  }
}

@keyframes esperStartupLava {
  0% {
    opacity: 0;
    transform: translate3d(-50%, -50%, 0) scale(0.1);
  }

  50% {
    opacity: 0.5;
    transform: translate3d(-50%, -50%, 0) scale(0.6);
  }

  100% {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
}

@keyframes esperBlink {
  0%,
  96% {
    height: var(--esper-blink-height);
  }

  98% {
    height: var(--esper-blink-closed);
  }

  100% {
    height: var(--esper-blink-height);
  }
}

@keyframes esperLookAround {
  0%,
  40% {
    left: 47%;
    box-shadow: var(--esper-eye-spacing) 0 0 rgba(255, 255, 255, 1);
  }

  45%,
  55% {
    left: 40%;
    box-shadow: var(--esper-eye-spacing) 0 0 rgba(255, 255, 255, 1);
  }

  60%,
  70% {
    left: 54%;
    box-shadow: var(--esper-eye-spacing) 0 0 rgba(255, 255, 255, 1);
  }

  75% {
    left: 47%;
    box-shadow: var(--esper-eye-spacing) 0 0 rgba(255, 255, 255, 1);
  }
}

@keyframes esperFloat {
  0%,
  100% {
    transform: translate3d(-50%, -50%, 0);
  }

  50% {
    transform: translate3d(-50%, calc(-50% - var(--esper-float-distance)), 0);
  }
}

@keyframes esperColorShift {
  0% {
    filter: blur(var(--esper-lava-blur)) hue-rotate(0deg);
  }

  100% {
    filter: blur(var(--esper-lava-blur)) hue-rotate(360deg);
  }
}

@keyframes esperGlowPulse {
  0%,
  100% {
    box-shadow: 0 0 var(--esper-glow-size) rgba(255, 255, 255, 0.1);
  }

  45% {
    box-shadow: 0 0 calc(var(--esper-glow-size) * 1.33) rgba(255, 255, 255, 0.2);
  }

  50% {
    box-shadow: 0 0 calc(var(--esper-glow-size) * 1.17) rgba(255, 255, 255, 0.15);
  }

  55% {
    box-shadow: 0 0 calc(var(--esper-glow-size) * 1.39) rgba(255, 255, 255, 0.2);
  }

  60% {
    box-shadow: 0 0 var(--esper-glow-size) rgba(255, 255, 255, 0.1);
  }
}

@keyframes esperPulse {
  0% {
    transform: scale(1);
    opacity: 0.9;
  }

  100% {
    transform: scale(1.15);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .esper-ai-sphere,
  .esper-lava,
  .esper-wave,
  .esper-ai-sphere::before,
  .esper-ai-sphere::after,
  .esper-lava::before,
  .esper-lava::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 768px) {
  :root {
    --esper-size: 400px;
    --esper-lava-size: 380px;
    --esper-glow-size: 120px;
    --esper-shadow-size: 100px;
    --esper-inner-glow: 80px;
    --esper-bottom-shadow: 100px;
  }

  .esper-wave-container {
    display: none;
  }
}
```

---

## 4. Minimal Usage Example

```tsx
import { EsperVisual } from './EsperVisual';

export default function ExamplePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at center, #1f2937 0%, #0f172a 45%, #020617 100%)',
      }}
    >
      <EsperVisual mode="general" showWaves={false} />
    </main>
  );
}
```

---

## 5. Original Visual Pieces These Came From

These were distilled from:
- `Fluent-ish/apps/react-vite/src/components/ai/esper-ai-companion.tsx`
- `Fluent-ish/apps/react-vite/src/components/ai/esper-ai.css`

I intentionally removed:
- `phase`
- `introPhase`
- `onIntroComplete`
- TTS fetch logic
- rotating messages
- text overlays
- dashboard positioning logic
- any integration with chat, history, or backend services

---

## 6. Best Way To Rebuild In Another Project

Have Cursor AI split this file into:
1. `EsperVisual.tsx`
2. `esper-visual.css`
3. optional usage file

If you want the orb only, keep:
- the component in section 2
- the CSS in section 3

If you want a cleaner static variant later, remove:
- `showWaves`
- `mode`
- startup classes
- hover scaling
*** End Patch
