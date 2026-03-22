/**
 * Shared formatters and trend/peak helpers. Used by both mock and real data flows.
 * No mock data; no API calls.
 */

/** Event types for timeline markers: icon (Ionicons name) and color (hex). */
export const EVENT_TYPES = {
  update: { icon: 'construct', color: '#00D9FF' },
  streamer: { icon: 'videocam', color: '#FF6B35' },
  sale: { icon: 'pricetag', color: '#22C55E' },
  rating: { icon: 'star', color: '#FF6B35' },
};

/**
 * Format player count for display (e.g. 1245000 -> "1.2M").
 */
export function formatPlayerCount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

/**
 * Format stream count for display (e.g. 2840 -> "2.8K").
 */
export function formatStreamCount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

/**
 * Format view count for display (e.g. 142000 -> "142K").
 */
export function formatViewCount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

/**
 * Returns { direction: 'rising'|'declining'|'stable', percentChange: number }.
 * Compares average of first 6 points vs last 6 points.
 */
export function getTrend(history) {
  if (!history || history.length < 12) {
    return { direction: 'stable', percentChange: 0 };
  }
  const first6 = history.slice(0, 6);
  const last6 = history.slice(-6);
  const avgFirst = first6.reduce((a, b) => a + b, 0) / first6.length;
  const avgLast = last6.reduce((a, b) => a + b, 0) / last6.length;
  const percentChange = avgFirst === 0 ? 0 : ((avgLast - avgFirst) / avgFirst) * 100;
  const threshold = 3;
  let direction = 'stable';
  if (percentChange > threshold) direction = 'rising';
  else if (percentChange < -threshold) direction = 'declining';
  return { direction, percentChange };
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MOCK_START_DAY = 15;

/**
 * Format hour index 0-167 as "Mon 2 AM", "Tue 5 PM", etc. for 7-day view.
 */
export function formatHourIn7d(position) {
  if (position == null || position < 0) return '';
  const hourIndex = Math.round(Math.min(167, Math.max(0, position)));
  const dayIdx = Math.floor(hourIndex / 24) % 7;
  const h = hourIndex % 24;
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${DAY_NAMES[dayIdx]} ${hour12} ${ampm}`;
}

/**
 * Format day index 0-29 as "Mar 15", "Mar 16", etc. for 30-day view.
 */
export function formatDayLabel(position) {
  if (position == null || position < 0) return '';
  const dayIndex = Math.round(Math.min(29, Math.max(0, position)));
  const day = MOCK_START_DAY + dayIndex;
  if (day <= 31) return `Mar ${day}`;
  return `Apr ${day - 31}`;
}

/**
 * Find the contiguous window of `windowSize` hours with the highest average value.
 * Returns { startHour, endHour, avgCount } or null if history is too short.
 */
export function findPeakWindow(history, windowSize = 3) {
  if (!history || history.length < windowSize) return null;
  let bestStart = 0;
  let bestAvg = -Infinity;
  for (let i = 0; i <= history.length - windowSize; i++) {
    let sum = 0;
    for (let j = i; j < i + windowSize; j++) sum += history[j];
    const avg = sum / windowSize;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestStart = i;
    }
  }
  return {
    startHour: bestStart,
    endHour: bestStart + windowSize - 1,
    avgCount: Math.round(bestAvg),
  };
}

/**
 * Format hour index 0-23 as "12 AM", "7 PM", etc. for peak labels.
 */
function formatHourForPeak(i) {
  if (i < 0 || i > 23) return '';
  if (i === 0) return '12 AM';
  if (i < 12) return `${i} AM`;
  if (i === 12) return '12 PM';
  return `${i - 12} PM`;
}

/**
 * Compute peak time insights for the Peak Time Predictor panel.
 * Uses 24h, 7d, and 30d player history. Returns { daily, weekly, monthly, confidence }
 * with labels and intensity (0-100) for each range.
 */
export function computePeakInsights(game) {
  if (!game) return null;
  const daily = game.history && game.history.length >= 3
    ? findPeakWindow(game.history, 3)
    : null;
  const weekly = game.history7d && game.history7d.length >= 6
    ? findPeakWindow(game.history7d, 6)
    : null;
  const monthly = game.history30d && game.history30d.length >= 3
    ? findPeakWindow(game.history30d, 3)
    : null;

  const avgOf = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const maxOf = (arr) => arr.length ? Math.max(...arr) : 0;

  const dailyLabel = daily
    ? `${formatHourForPeak(daily.startHour)} – ${formatHourForPeak(daily.endHour)}`
    : null;
  const dailyIntensity = daily && game.history.length
    ? Math.min(100, Math.round((daily.avgCount / maxOf(game.history)) * 100))
    : 0;

  const weeklyLabel = weekly && game.history7d
    ? formatHourIn7d(weekly.startHour)
    : null;
  const weeklyIntensity = weekly && game.history7d.length
    ? Math.min(100, Math.round((weekly.avgCount / maxOf(game.history7d)) * 100))
    : 0;

  const monthlyLabel = monthly && game.history30d.length
    ? `${formatDayLabel(monthly.startHour)} – ${formatDayLabel(monthly.endHour)}`
    : null;
  const monthlyIntensity = monthly && game.history30d.length
    ? Math.min(100, Math.round((monthly.avgCount / maxOf(game.history30d)) * 100))
    : 0;

  const overallAvg = daily ? avgOf(game.history) : 0;
  const peakRatio = daily && overallAvg > 0 ? daily.avgCount / overallAvg : 1;
  let confidence = 'low';
  if (peakRatio >= 1.15) confidence = 'high';
  else if (peakRatio >= 1.05) confidence = 'medium';

  return {
    daily: dailyLabel ? { label: dailyLabel, intensity: dailyIntensity, window: daily } : null,
    weekly: weeklyLabel ? { label: weeklyLabel, intensity: weeklyIntensity, window: weekly } : null,
    monthly: monthlyLabel ? { label: monthlyLabel, intensity: monthlyIntensity, window: monthly } : null,
    confidence,
  };
}

/**
 * Returns true if the current hour (0-23) falls inside the 24h peak window.
 */
export function isInPeakWindowNow(game) {
  if (!game || !game.history || game.history.length < 3) return false;
  const pw = findPeakWindow(game.history, 3);
  if (!pw) return false;
  const now = new Date();
  const hour = now.getHours();
  return hour >= pw.startHour && hour <= pw.endHour;
}
