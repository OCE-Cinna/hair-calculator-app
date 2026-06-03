# UI/UX Evolution — PAH Visualizer

This document traces the full design and interface evolution of Cinna's PAH Visualizer from the initial Semester 2 proof of concept through the current production build. It covers the rationale behind major design decisions, the implementation of the glassmorphism design system, the responsive layout architecture, and the specific bugs and cross-browser / cross-device issues encountered and resolved during development.

---

## Phase 0: Proof of Concept (Semester 2)

The original PoC was built in vanilla JavaScript with Three.js directly. The UI was minimal and intentionally throwaway — a flat HTML form with basic sliders sitting beside a WebGL canvas. There was no design system, no theme, and no responsive layout. The main priority was feasibility: can you raycast onto a head mesh and place braids at all?

**What this phase established:**
- The core interaction model: sliders map directly to 3D parameters
- The need for a cleaner separation between state and rendering
- The limits of non-reactive state management (updating the canvas on every slider input event caused visual stuttering)

The PoC was eventually retired and the codebase migrated from Fontys GitLab to GitHub at the start of Semester 3.

---

## Phase 1: React Migration — Establishing the Shell

When the project was refactored into React 19 + Vite + R3F, the first UI question was: what should the layout *feel* like?

### The decision to use glassmorphism

The original brief called for a UI that "does not distract from the 3D visualization." That requirement ruled out opaque, traditional web UI patterns. The 3D scene needed to be the primary visual focus; the controls and calculator needed to feel like they were floating over or alongside it — not framing it in a separate panel.

Glassmorphism — the translucent frosted-glass aesthetic — was the natural fit. It allows the interface panels to occupy the same visual plane as the canvas without competing with it. Semi-transparent panels with `backdrop-filter: blur()` let the background bleed through, creating visual depth while keeping the controls legible.

The specific design choices made at this stage:
- **Rounded panels** (`border-radius: 1.5rem`, `rounded-3xl` in Tailwind) — softer and more premium than sharp corners
- **Subtle borders** at `oklch(100% 0 0 / 40%)` (40% white) in light mode — visible enough to define panel edges without being heavy
- **Soft box shadows** (`0 20px 50px -12px oklch(0% 0 0 / 8%)`) — adds perceived elevation without looking like a dated "card with drop shadow" pattern
- **No solid backgrounds** — every panel uses semi-transparent fills so the color of the page background bleeds through

### OKLCH over HEX/HSL

The colour space choice was a deliberate technical decision. `HEX` and `HSL` are not perceptually uniform — when you lighten or darken an `HSL` colour, the perceived brightness shift is inconsistent across different hues. This makes it hard to build a theme system where all tones feel equally weighted.

`OKLCH` is perceptually uniform: equal steps in lightness (`L`) produce equal perceived brightness changes regardless of hue. This means the brand orange (`oklch(73.682% 0.16644 40.061)`) stays visually consistent across both light and dark mode without needing a separate dark-mode-specific value. The same token is used in both themes.

```css
/* defined once — works in both themes */
--color-brand: oklch(73.682% 0.16644 40.061);
```

All text, glass, border, and shadow tokens follow the same OKLCH pattern. The theme system is built entirely by swapping lightness values on the same underlying tokens rather than defining separate colour palettes per theme.

---

## Phase 2: The Design System (`index.css`)

### Token architecture

All design values are defined as CSS custom properties on `:root` (light mode) and `.dark` (dark mode). Tailwind CSS v4's `@theme` block re-exposes these as utility classes. This means:

1. Every Tailwind class like `bg-glass-panel` or `text-text-muted` is backed by a CSS custom property
2. Switching theme is a single class toggle on `document.documentElement` (`.dark` on/off)
3. The R3F canvas background is also driven by a CSS variable (`--color-canvas-bg`), read at runtime via `getComputedStyle` inside the `ThreeDSceneContent` component — ensuring the 3D background always matches the HTML background

**Light mode glass values:**
```css
--color-glass-panel:        oklch(100% 0 0 / 60%);   /* 60% white — legible frosted panel */
--color-glass-header:       oklch(100% 0 0 / 40%);   /* 40% white — more transparent */
--color-glass-menu:         oklch(100% 0 0 / 95%);   /* near-opaque for dropdown menus */
--color-border-glass:       oklch(100% 0 0 / 40%);   /* subtle border */
--color-border-glass-strong: oklch(100% 0 0 / 60%);  /* stronger border for emphasis */
```

**Dark mode equivalents:**
```css
.dark {
    --color-glass-panel:        oklch(100% 0 0 / 5%);    /* near-invisible — depth from backdrop blur */
    --color-glass-header:       oklch(100% 0 0 / 5%);
    --color-glass-menu:         oklch(15% 0.02 30 / 95%); /* dark menu for readability */
    --color-border-glass:       oklch(100% 0 0 / 10%);
    --color-border-glass-strong: oklch(100% 0 0 / 15%);
}
```

In dark mode the panels are nearly transparent — you can see the deep `oklch(15% 0.02 30)` background (a rich brown-black) bleeding through. The glass effect becomes more pronounced because the backdrop-blur interacts with the darker canvas background.

### The `glass-responsive` performance fix

`backdrop-filter: blur()` is GPU-intensive. On desktop it runs fine at `blur(40px)`. On mobile it caused visible frame rate drops on lower-end hardware, particularly on the Pixel 8 tested during development (see device testing notes below).

The solution was a single utility class that steps the blur down at the mobile breakpoint:

```css
.glass-responsive {
    backdrop-filter: blur(40px);
}

@media (max-width: 768px) {
    .glass-responsive {
        backdrop-filter: blur(12px);
    }
}
```

This class is applied to every major glass panel: the sidebar, the preset panel, the burger menu, the calculator card. The reduction from 40px to 12px is visually acceptable — the frosted effect is still perceivable but the render cost drops significantly.

### Ambient orbs

Two large blurred circles sit behind the entire layout as a decorative depth layer:

```jsx
<div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] 
     bg-brand rounded-full mix-blend-orb filter blur-[120px] opacity-orb-low" />
<div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] 
     bg-[var(--color-skin-fallback)] rounded-full mix-blend-orb 
     filter blur-[150px] opacity-orb-mid" />
```

The blend mode (`mix-blend-orb`) is theme-aware — `multiply` in light mode (orbs darken the background slightly, adding warmth) and `screen` in dark mode (orbs add a subtle glow without bleaching the dark background). The opacity values are also separate per theme:

```css
:root  { --orb-opacity-low: 0.1;  --orb-opacity-mid: 0.15; }
.dark  { --orb-opacity-low: 0.2;  --orb-opacity-mid: 0.3;  }
```

The orbs are `pointer-events: none` so they never intercept clicks.

### Typography

Two Google Fonts are loaded:
- **Outfit** — headings (`h1–h6`). Geometric sans-serif with a premium, contemporary feel. Used for panel titles, section labels, and the pack count badge.
- **Inter** — body text. The standard for high-legibility UI text at small sizes. Used for all paragraphs, labels, and button text.

Both are referenced through CSS variables (`--font-heading`, `--font-body`) and applied in the `@layer base` block, ensuring they cascade without per-class font declarations.

---

## Phase 3: Component Architecture Refactor

As the codebase grew, the flat `src/` directory became unmanageable. All component files were refactored into a feature-sliced layout:

```
src/
├── features/       # domain-specific logic
│   ├── 3d/         # Experience.jsx, HeadModel.jsx, ViewportControls.jsx, styles/
│   ├── calculator/ # HairPacksPanel.jsx
│   └── devkit/     # DevKit.jsx, BakePartings.jsx
├── layouts/        # structural shells — LeftSidebar.jsx, PresetPanel.jsx
├── components/     # generic reusables — PresetGallery.jsx, Sliders.jsx, ui/
├── stores/         # hairStore.js, devStore.js
├── constants/      # hairConfig.js, presets.js
├── utils/          # calculator.js
└── data/           # partings/box_braids.json
```

This restructure had direct UI implications:
- **`App.jsx` became a pure layout shell** — it imports from `features/`, `layouts/`, and `components/` but contains no business logic. This made the top-level file much easier to reason about when debugging layout bugs.
- **`layouts/`** contains only structural skeletons (`LeftSidebar`, `PresetPanel`). Layout bugs are immediately isolated to these files.
- **`components/ui/`** separates generic interactive atoms (`BurgerMenu`, `ThemeSwitcher`) from composite layout components, making it clearer which components can be reused safely.

---

## Phase 4: Layout Architecture

### Early problem — two canvas instances

During the initial mobile layout attempt, the approach was to have two separate `<Experience />` components — one in a desktop branch of the JSX tree, one in a mobile branch — and hide the inactive one with `display: none`. This was catastrophic for performance: both WebGL contexts were initialised and consuming GPU memory even when not visible. On lower-end Android devices (Pixel 8 tested) this caused visible lag and, on one occasion, a GPU context loss error that crashed the canvas.

### The fix — single canvas, unified flex layout

The layout was refactored to mount `<Experience />` exactly once inside a unified flex tree that reflows between vertical (mobile) and horizontal (desktop) based on viewport size. The key class string on the 3D viewport wrapper:

```
h-[44dvh] lg:h-full landscape:h-full
shrink-0 flex-none lg:flex-1 landscape:flex-1
rounded-none lg:rounded-3xl landscape:rounded-3xl
border-b lg:border border-border-glass
```

**What each part does:**
- `h-[44dvh]` — on portrait mobile, the 3D viewport takes 44% of the dynamic viewport height (not `vh`, which ignores the browser chrome). This leaves exactly enough room for the preset gallery and calculator below without needing to scroll.
- `lg:h-full` / `landscape:h-full` — on desktop or landscape, the viewport takes the full column height.
- `flex-none lg:flex-1 landscape:flex-1` — on mobile the viewport has a fixed height; on desktop/landscape it flexes to fill remaining horizontal space after the sidebar and preset column.
- `rounded-none lg:rounded-3xl landscape:rounded-3xl` — on mobile the 3D panel is edge-to-edge with no border radius. On desktop/landscape it gets the standard `3xl` radius to match the other glass panels.
- `border-b lg:border` — on mobile only the bottom border is shown (separating the viewport from the scrollable panel below). On desktop all four sides get a border.

### Portrait vs landscape mobile — the `landscape:` breakpoint

A standard Tailwind `md:` breakpoint is width-based. A phone in landscape orientation can be 900px wide — triggering desktop styles — which is wrong: the screen is still short and touch-optimised.

The `landscape:` breakpoint was added to handle this explicitly. When the device is in landscape (regardless of width), the layout switches to the desktop horizontal flex arrangement:

```jsx
<div className="flex flex-col lg:flex-row landscape:flex-row ...">
```

Mobile header and mobile preset gallery are hidden in landscape:
```jsx
<div className="lg:hidden landscape:hidden ...">
```

Desktop sidebar and preset panel become visible in landscape:
```jsx
<div className="hidden lg:flex landscape:flex ...">
```

This means a phone rotated sideways gets the desktop sidebar + preset column + horizontal layout, which works well in landscape because the screen has enough horizontal room but no vertical room.

---

## Phase 4: Mobile Viewport Issues in Detail

### The `100dvh` vs `100vh` problem

Early versions used `h-screen` (`height: 100vh`). On iOS Safari and Chrome for Android, `100vh` includes the space occupied by the browser's address bar and navigation UI — the actual visible content area is shorter. This caused the bottom of the calculator panel to be clipped under the browser chrome, with no ability to scroll to it.

The fix was switching to `h-[100dvh]` (dynamic viewport height). `dvh` updates in real time as the browser chrome shows/hides during scroll, and is calculated from the actual visible viewport, not the full browser window. This resolved the clipping on iPhone 14 Safari immediately.

```jsx
<div className="bg-app-main h-[100dvh] flex overflow-hidden ...">
```

The inner 3D viewport uses the same unit: `h-[44dvh]`.

### Scroll behaviour in the form column

The calculator column (`HairPacksPanel` + preset gallery on mobile) needs to scroll independently while the 3D viewport stays fixed. The naive approach — `overflow-y: auto` on the column — worked on desktop but caused two issues on mobile:

1. **iOS momentum scrolling**: Without `-webkit-overflow-scrolling: touch`, the scroll felt stiff and non-native on iPhone 14
2. **Overscroll bubbling**: Reaching the top or bottom of the column caused the whole page to bounce, sometimes pulling the 3D canvas into view unexpectedly

The fixes applied:
```jsx
className="overflow-y-auto overflow-x-hidden overscroll-none touch-pan-y hide-scrollbar"
style={{ WebkitOverflowScrolling: 'touch' }}
```

- `overscroll-none` prevents the scroll from propagating to the parent
- `touch-pan-y` tells the browser this element scrolls vertically, improving touch scroll performance
- `WebkitOverflowScrolling: 'touch'` enables native momentum scrolling on iOS
- `hide-scrollbar` hides the scrollbar visually (using a utility class with `scrollbar-width: none` and `::-webkit-scrollbar { display: none }`)

### The 3D canvas touch conflict

React Three Fiber's `<Canvas>` component registers its own pointer event handlers for orbit control. This conflicted with the page's vertical scroll gestures on mobile — dragging up on the 3D canvas would simultaneously orbit the model AND try to scroll the page, resulting in erratic behaviour.

The fix was `touchAction: 'none'` on the canvas wrapper:
```jsx
<div className="w-full h-full relative overflow-hidden" style={{ touchAction: 'none' }}>
```

This tells the browser to not handle touch gestures natively on this element and hand full control to the JavaScript event listeners (R3F's orbit controls). The trade-off is that the 3D canvas is now non-scrollable — but it was never supposed to scroll, so this is correct.

---

## Phase 5: Cross-Browser Issues

### Webkit slider thumb alignment — Chrome vs Firefox vs Edge

The custom range slider in `HairPacksPanel` uses heavily customised CSS pseudo-elements to replace the browser's default thumb and track:

```css
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:h-8
[&::-webkit-slider-thumb]:w-8
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-brand
[&::-webkit-slider-thumb]:border-2
[&::-webkit-slider-thumb]:border-white
[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,0,0.5)]
[&::-webkit-slider-thumb]:-mt-4
```

The `-mt-4` (negative top margin) is required in Webkit (Chrome and Edge) to vertically centre the thumb on the track. This is a known Webkit quirk: the thumb is positioned relative to the track height and needs to be pulled upward manually to appear centred.

**Firefox** uses a completely different pseudo-element (`::-moz-range-thumb`) and centres the thumb automatically. Applying the negative margin to Firefox caused the thumb to sit above the track rather than on it. The solution is separate pseudo-element rules for each engine:

```css
/* Webkit (Chrome, Edge, Safari) — needs manual centering */
[&::-webkit-slider-thumb]:-mt-4

/* Firefox — auto-centered, no -mt needed */
[&::-moz-range-thumb]:h-8
[&::-moz-range-thumb]:w-8
[&::-moz-range-thumb]:rounded-full
[&::-moz-range-thumb]:bg-brand
[&::-moz-range-thumb]:border-2
[&::-moz-range-thumb]:border-white
[&::-moz-range-thumb]:shadow-[0_0_10px_rgba(255,107,0,0.5)]
```

The track itself is zeroed out for both engines:
```css
[&::-webkit-slider-runnable-track]:h-0
[&::-moz-range-track]:h-0
```

This makes the visual track the `<div>` layered behind the `<input>`, not the native track — giving full control over the appearance.

### Tooltip visibility on touch devices

Tooltips on the style selector (showing "IN DEVELOPMENT" for non-Box-Braids styles) were implemented using CSS hover states only:

```css
.group-hover:opacity-100
.group-hover:visible
```

On touch devices (Pixel 8, iPhone 14) there is no hover state — tapping a button fires `click` but never triggers `:hover`. This meant the tooltip was invisible on mobile and users had no idea why tapping Knotless/Twists/Locs did nothing.

The fix was adding `group-focus` and `group-active` states alongside `group-hover`:
```jsx
className="... opacity-0 invisible 
  group-hover:opacity-100 group-hover:visible 
  group-focus:opacity-100 group-focus:visible
  group-active:opacity-100 group-active:visible 
  transition-all duration-200 ..."
```

- `group-focus` fires when a button receives keyboard focus (accessibility)
- `group-active` fires during a touch press, giving at least a brief tooltip flash on tap

The same pattern was applied to the "Hair Packs" info tooltip in the result card (`HairPacksPanel`).

### Firefox `backdrop-filter` rendering

Firefox supports `backdrop-filter` but renders it differently from Chrome/Safari at equivalent `blur()` values. At `blur(40px)`, Chrome produces a smooth frosted effect; Firefox can produce a slightly more aggressive blur that makes the glass panels look milky rather than frosted on some screen configurations.

The current `blur(40px)` value was tuned to look correct on Chrome and acceptable on Firefox. There is no Firefox-specific override in the current build because Firefox's behaviour is within the acceptable visual range. Safari on iOS matches Chrome's rendering closely.

---

## Phase 6: Device-Specific Test Notes

### Pixel 8 (Android 14, Chrome)

**Viewport height**: The Pixel 8's Chrome browser hides the address bar during scroll, changing the visible viewport height dynamically. The switch from `100vh` to `100dvh` fully resolved this — the layout adapts smoothly as the chrome shows/hides.

**Backdrop blur performance**: At `blur(40px)`, the glass panels caused a perceptible lag when the DevKit panel opened (it slides in with a Framer Motion animation while behind it multiple glass panels are composited). The `glass-responsive` `@media` breakpoint at 768px catches the Pixel 8 in portrait and reduces blur to `12px`. The DevKit open animation became smooth after this fix.

**Touch targets**: The LeftSidebar icon buttons (`p-2.5` = ~38px touch target) were borderline on Pixel 8 in portrait mode when the sidebar appears in landscape mode. The buttons pass the WCAG 2.5.5 minimum (`24×24px`) but are tighter than ideal. This is a noted open item rather than a resolved bug.

**Haptic feedback**: `navigator.vibrate()` works on Pixel 8 Chrome. The slider haptics (2ms pulse on drag, 5ms on style selection, 10ms on Dev Kit toggle) are perceptible and provide useful tactile confirmation. This API is not available on iOS.

### iPhone 14 (iOS 17, Safari)

**Safe area insets**: The iPhone 14 has a Dynamic Island notch and a home indicator bar. Without `env(safe-area-inset-*)`, the mobile header and the bottom of the calculator column could be obscured. The `h-[100dvh]` unit intrinsically accounts for the safe area on modern iOS Safari, preventing content from being clipped under the home indicator.

**Haptics**: `navigator.vibrate` is not supported on iOS Safari. The calls are guarded with `if (window.navigator.vibrate)` so they fail silently.

**Momentum scroll feel**: The `-webkit-overflow-scrolling: touch` inline style was essential on iOS. Without it the calculator column scrolled in discrete jumps rather than with the smooth kinetic/momentum behaviour expected on iOS. After applying the style, the scroll matched native iOS app behaviour.

**Landscape keyboard**: When the virtual keyboard opens in landscape on iPhone 14 (e.g. if a future text input were added), the `dvh` unit would shrink with the visible viewport. This is correct behaviour — the current build has no text inputs so the keyboard issue has not been encountered, but `dvh` handles it correctly for future-proofing.

**Backdrop filter quality**: iOS Safari renders `backdrop-filter: blur()` using the GPU compositor, which is more efficient than Chrome's CPU fallback. The blur looked sharp and consistent on iPhone 14 Safari and did not cause frame drops even at `40px`, though the `glass-responsive` reduction is still applied at the `768px` breakpoint.

---

## Phase 8: The Viewport Controls Overlay

The viewport toggle buttons (`ViewportControls`) are a glass panel overlaid at the top-right corner of the 3D canvas. They allow toggling the parting pattern, braid visibility, root-only mode, and lighting preset.

These were added after user feedback that the 3D viewport felt "static" and that there was no way to inspect the scalp parting without going into the Dev Kit. The controls needed to:
- Be accessible without opening any menu or panel
- Not obscure the 3D content they control
- Work cleanly on both desktop and mobile

The solution was a thin vertical strip of icon buttons in a compact glass panel, positioned `absolute top-4 right-4 z-20` inside the canvas wrapper. The panel uses the same glassmorphism tokens as the rest of the UI.

### Locked to light theme regardless of dark mode

The viewport controls overlay sits directly on top of the 3D canvas. In dark mode the glass panel tokens become very transparent (near-`5%` white fill), which made the icon buttons nearly invisible against the dark `oklch(25% 0.01 20)` canvas background. The icons could not be seen unless the user already knew where to look.

The fix was to pin the overlay to the light-mode glass appearance regardless of the global theme. Rather than adding a separate dark-mode override, the component uses Tailwind's hardcoded values directly for this element:

```jsx
<div className="bg-white/50 glass-responsive backdrop-blur-md border border-white/30 rounded-2xl shadow-glass overflow-hidden flex flex-col p-1.5 gap-1.5">
```

`bg-white/50` and `border-white/30` are absolute values — they do not pull from CSS custom properties — so they render at the same opacity in both light and dark mode. The result is a consistently legible panel that always has enough contrast against whatever the 3D canvas background is.

### The lighting cycle button

Cycling through three modes (`natural → studio → moody`) from one button requires communicating the current mode. The solution was an animated icon swap using Framer Motion's `AnimatePresence`:

```jsx
<AnimatePresence mode="wait">
    <motion.div
        key={lightingMode}
        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
        transition={{ duration: 0.2 }}
    >
        {lightingMode === 'natural' && <Sun className="w-5 h-5 text-amber-500" />}
        {lightingMode === 'studio' && <Sparkles className="w-5 h-5 text-blue-400" />}
        {lightingMode === 'moody' && <Moon className="w-5 h-5 text-indigo-400" />}
    </motion.div>
</AnimatePresence>
```

The icon rotates and scales in/out when the mode changes. Each icon uses a colour that intuitively maps to the mode (warm amber for natural, cool blue for studio, deep indigo for moody). The `title` attribute provides accessible tooltip text showing the current mode name.

---

## Phase 9: The Burger Menu

The `BurgerMenu` is the primary navigation/info drawer on mobile. On desktop it slides in from the left edge; on mobile it appears as a centered modal sheet.

The same component handles both layouts via a single complex className string:

```
fixed z-50 flex flex-col bg-glass-menu glass-responsive shadow-2xl
transition-all duration-300 ease-in-out

/* Mobile: centered rounded sheet */
top-0 bottom-0 left-0 right-0 m-auto
h-auto w-[calc(100vw-1rem)] max-w-sm max-h-[95dvh] rounded-3xl
border border-divider-faint overflow-hidden

/* Desktop/Landscape: left-edge drawer */
lg:m-0 lg:top-0 lg:left-0 lg:bottom-auto lg:right-auto
lg:h-full lg:w-80 lg:max-w-none lg:max-h-none
lg:rounded-none lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:border-r
```

**Open/close animation differences by breakpoint**: On desktop the menu slides in from the left (`-translate-x-full` when closed). On mobile it fades and scales in from center (`scale-95` → `scale-100`, `opacity-0` → `opacity-100`). This is handled through the closed-state class:

```
opacity-0 scale-95 translate-x-0 pointer-events-none
lg:opacity-100 lg:scale-100 lg:-translate-x-full
landscape:opacity-100 landscape:scale-100 landscape:-translate-x-full
```

When closed on desktop, the menu is `opacity-100 scale-100` (fully rendered) but translated off-screen to the left. On mobile it is `opacity-0 scale-95` at center — a different animation entirely from the same `isOpen` boolean.

### The scrim (backdrop)

The semi-transparent overlay behind the burger menu (`bg-black/60 backdrop-blur-md`) required careful z-index management to sit between the menu (`z-50`) and the canvas (`z-10`) without also covering the DevKit overlay. This was resolved by using `z-40` for the scrim.

---

## Phase 10: Framer Motion Integration

Framer Motion drives all animated transitions in the UI. The key animation decisions:

**Preset panel open/close** — width-based spring animation:
```jsx
initial={{ width: 0, opacity: 0 }}
animate={{ width: 192, opacity: 1 }}
exit={{ width: 0, opacity: 0 }}
transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
```
The cubic bezier `[0.22, 1, 0.36, 1]` is a fast-out-slow-in curve that feels snappy at the start and eases gracefully at the end — the "expressive" motion standard. The 3D viewport uses `layout` mode to animate its own size change as the preset panel opens/closes beside it.

**Pack count badge** — spring pop:
```jsx
initial={{ scale: 0.75, opacity: 0, y: 8 }}
animate={{ scale: 1, opacity: 1, y: 0 }}
exit={{ scale: 1.15, opacity: 0, y: -8 }}
transition={{ type: 'spring', stiffness: 400, damping: 20 }}
```
The number animates on `key={Math.round(packsResult)}` — each unique rounded integer gets its own mount/unmount cycle so changing from 3 to 4 packs feels like a new element arriving rather than a number updating in place.

**Panel entry** — staggered slide-in:
The form column enters from the right (`x: 20 → 0`) with a `0.15s` delay, so it arrives slightly after the viewport canvas which enters on `opacity: 0 → 1`. The sequence creates a layered reveal on first load.

---

## Phase 11: StylistPanel → DevKit — Component Sunset

The earliest version of the calibration panel was called `StylistPanel`. It was later accompanied by a separate `AssetManager` component for handling file uploads. Over time these two components diverged in responsibility but shared state in confusing ways, and the visual style of `AssetManager` did not match the glassmorphism system established for the rest of the app.

The two components were merged and entirely replaced with a unified `DevKit.jsx`. The migration addressed several UI problems:

**Before (StylistPanel + AssetManager):**
- Two separate components with separate toggle mechanisms
- `AssetManager` used its own local React state for upload previews, separate from `useDevStore`
- No visual consistency — `AssetManager` used `border: 1px solid` flat styling from an earlier phase
- Opening `StylistPanel` required a different entry path than opening `AssetManager`

**After (unified DevKit):**
- Single `DevKit.jsx` component, single toggle (`isEnabled` in `useDevStore`)
- All asset uploads, bust combo management, calibration sliders, and bake triggers live in one panel
- Consistent glassmorphism styling throughout — same tokens, same `rounded-3xl`, same panel structure as the rest of the app
- A single entry point: the Settings icon in the `LeftSidebar` (desktop) or the toggle button in `BurgerMenu` (mobile)

The `DevKit` panel also introduced the **Bust Combo** system — a way to save and restore pairs of `(custom_bust.glb, scalp_mask.jpeg)` that had been tested together. This was a UX concept that did not exist in the old `StylistPanel` because the asset upload was stateless (it did not remember previous uploads between sessions). In `DevKit`, combos are persisted to `useDevStore.bustCombos` in `localStorage`.

---

## Current State Summary

| Area | Status |
|------|--------|
| Glassmorphism design system | Fully implemented, dual-theme |
| OKLCH token architecture | Complete — all values in `index.css` |
| Feature-sliced component structure | Complete — `features/`, `layouts/`, `components/`, `stores/` |
| Single canvas layout | Resolved — one `<Experience />` mount |
| Portrait mobile layout | Working — `44dvh` viewport, scrollable form column |
| Landscape mobile layout | Working — `landscape:` breakpoint matches desktop layout |
| `100dvh` safe-area compliance | Resolved |
| iOS momentum scroll | Resolved via `-webkit-overflow-scrolling` |
| Touch tooltip visibility | Resolved via `group-active` and `group-focus` states |
| WebKit slider thumb alignment | Resolved via `-mt-4` on `::-webkit-slider-thumb` |
| Firefox slider compatibility | Resolved via separate `::-moz-range-thumb` rules |
| Backdrop blur performance on mobile | Resolved via `glass-responsive` (40px → 12px at ≤768px) |
| `backdrop-filter` 3D canvas conflict | Resolved via `touchAction: 'none'` on canvas wrapper |
| Viewport controls contrast in dark mode | Resolved — overlay hardcoded to light glass values |
| StylistPanel / AssetManager | Replaced — unified `DevKit.jsx` with persistent bust combos |
| Pixel 8 Chrome testing | Passing — all glass, scroll, and layout issues resolved |
| iPhone 14 Safari testing | Passing — `dvh`, momentum scroll, tooltip all working |
