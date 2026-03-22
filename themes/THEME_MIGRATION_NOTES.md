# Theme migration: NEXA Mobile → ShaqGPT DarkNeon

Notes for switching NEXA Mobile to ShaqGPT’s **DarkNeon** color theme.

---

## 1. Theme being replaced (current NEXA Mobile)

**Source:** `nexa-mobile/src/theme/colors.js`  
**Role:** Current NEXA design tokens (aligned with web `index.css :root`).

| Key | Value |
|-----|--------|
| **Primary / neon** | |
| `neonPurple` | `#9d4edd` |
| `neonPurpleDark` | `#7b2cbf` |
| `neonTeal` | `#00f5ff` |
| `neonTealDark` | `#00d9e3` |
| `neonPink` | `#ff006e` |
| `neonPinkDark` | `#c71f66` |
| **Glass** | |
| `glassWhite` | `rgba(255, 255, 255, 0.08)` |
| `glassBorder` | `rgba(255, 255, 255, 0.15)` |
| `glassShadow` | `rgba(0, 245, 255, 0.1)` |
| **Backgrounds** | |
| `bgVoid` | `#0a0a0f` |
| `bgField` | `#12121a` |
| `bgPanel` | `rgba(18, 18, 26, 0.85)` |
| **Functional** | |
| `success` | `#00ffc2` |
| `warning` | `#ffb700` |
| `error` | `#ff0055` |
| **Text** | |
| `textPrimary` | `#ffffff` |
| `textSecondary` | `rgba(255, 255, 255, 0.7)` |

**Structure:** Flat object; no semantic keys like `background` / `surface` / `primary`. Uses NEXA-specific names (`bgVoid`, `neonTeal`, etc.).

---

## 2. Theme we are transferring to (ShaqGPT DarkNeon)

**Source:** `ShaqGPT/app/theme/colors.js` → `darkNeon`  
**Description:** Dark + Neon – dark UI with bright accents.

| Key | Value |
|-----|--------|
| `background` | `#0D0D0D` |
| `surface` | `#1A1A1D` |
| `primary` | `#FF6B35` |
| `secondary` | `#00D9FF` |
| `accent` | `#FF6B35` |
| `text` | `#F5F5F5` |
| `textSecondary` | `#9CA3AF` |
| `border` | `#27272A` |
| `success` | `#22C55E` |
| `error` | `#EF4444` |

**Structure:** Semantic keys only (no `warning`). Same keys as other ShaqGPT themes for easy theme switching.

---

## 3. Mapping: current NEXA → DarkNeon

When replacing the current NEXA theme with DarkNeon, components that use NEXA keys will need a mapping (or a compatibility layer) until they are updated to use semantic keys:

| NEXA (replaced) | DarkNeon equivalent |
|------------------|----------------------|
| `bgVoid` | `background` → `#0D0D0D` |
| `bgField` / `bgPanel` | `surface` → `#1A1A1D` |
| `neonPurple` / `neonTeal` (primary use) | `primary` → `#FF6B35` |
| `neonTeal` (secondary use) | `secondary` → `#00D9FF` |
| — | `accent` → `#FF6B35` (new) |
| `textPrimary` | `text` → `#F5F5F5` |
| `textSecondary` | `textSecondary` → `#9CA3AF` |
| `glassBorder` | `border` → `#27272A` |
| `success` | `success` → `#22C55E` |
| `error` | `error` → `#EF4444` |
| `warning` | *(no DarkNeon key; keep or define separately)* |

**Note:** DarkNeon has no `warning`; NEXA’s `#ffb700` would need to stay as an extra token or be dropped if not used.

---

## 4. Summary

- **Replaced:** Current NEXA theme in `nexa-mobile/src/theme/colors.js` (purple/teal/pink neons, `bgVoid`/`bgField`, glass, warning).
- **Replacing with:** ShaqGPT **DarkNeon** theme (orange primary `#FF6B35`, cyan secondary `#00D9FF`, dark backgrounds, semantic keys).
- **Location for these notes:** `themes/THEME_MIGRATION_NOTES.md`.
