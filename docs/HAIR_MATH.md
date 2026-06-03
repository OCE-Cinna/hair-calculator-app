# Hair Pack Calculation Logic

This document outlines the mathematical baseline and logic used by the PAH Visualizer's hair pack calculator algorithm.

## The Baseline Unit (The "Pack")

In the braiding industry, the term "pack" can be highly ambiguous. A standard retail "pack" of pre-stretched X-pression hair might contain 2, 3, or even 4 separate bundles of hair.

To provide consistent, mathematical accuracy, **the calculator defines 1 "Pack" (or 1 Unit) as a single ~50g bundle of 46-inch pre-stretched X-pression hair.**

For example:
- If the calculator estimates **4 Packs**, you need **4 bundles**.
- In retail terms, this equates to **two** 2-bundle packs, or one large 4-bundle pack.

### Baseline Anchor Parameters

The entire multiplier system is anchored to one specific hairstyle to establish `1.0` equivalencies:
- **Style:** Box Braids (`1.0` multiplier)
- **Thickness:** Medium (`1.0` multiplier)
- **Density:** Medium (`1.0` multiplier)
- **Length:** Shoulder / 24" unfolded (`1.0` multiplier)

When a user selects Box Braids + Medium Thickness + Medium Density + Shoulder Length, the formula produces the mathematically expected baseline result.

---

## The Formula

```javascript
Estimated Bundles = (style + thickness + density) * length * calibrationFactor
```

Implemented in `src/utils/calculator.js`:

```js
export const calculateHairPacks = (style, thickness, density, length, factor = 0.95) => {
    return (style + thickness + density) * length * factor;
};
```

`style`, `thickness`, `density`, and `length` are the **coefficient values** read from the maps in `src/constants/hairConfig.js` — not the slider positions themselves. The slider position is used to look up the coefficient, and the coefficient is what flows into the formula.

The `calibrationFactor` (default `0.95`, adjustable in the Dev Kit via `DEV_CONFIG.calibrationFactor`) acts as a normalization anchor. It ensures that the sum of the `1.0` baseline multipliers correctly evaluates to the real-world bundle requirement for a standard medium box braid install.

### Example — baseline defaults

| Parameter | Slider position | Coefficient |
|-----------|----------------|-------------|
| Style | Box Braids (1) | 1.0 |
| Thickness | Medium (4) | 1.0 |
| Density | Medium (3) | 1.0 |
| Length | Shoulder (3) | 1.0 |

```
(1.0 + 1.0 + 1.0) * 1.0 * 0.95 = 2.85 packs
```

The result is displayed as both an exact decimal (`2.85 exact bundles`) and a rounded whole-number count (`3 packs`).

---

## Style Multipliers

Each style has a **pack multiplier** that captures the relative material weight of that style compared to Box Braids. It also ships with bundled default slider positions that are applied when the user selects the style via `selectStyle()`.

| Style | Pack mult | Default thickness | Default length | Default density |
|-------|-----------|-------------------|----------------|-----------------|
| Box Braids | 1.0 | Medium (4) | Shoulder (3) | Medium (3) |
| Knotless | 1.2 | Smedium (3) | Shoulder (3) | Full (4) |
| Twists | 0.9 | Medium (4) | Shoulder (3) | Medium (3) |
| Locs | 1.1 | Smedium (3) | Waist (5) | Low (2) |

> **Note:** The style selector in the current UI only allows Box Braids to be selected. Knotless, Twists, and Locs are marked **IN DEVELOPMENT** and their slider defaults are enforced only when a preset with a different style is loaded.

---

## Thickness Multipliers

Thickness coefficients are normalized against Medium (`1.0`). They are not raw physical measurements — they represent the **relative material cost per braid** compared to a medium braid.

| Pos | Label | Coefficient | Notes |
|-----|-------|-------------|-------|
| 1 | Micro | 0.29 | ~0.02 / 0.07 baseline ratio |
| 2 | Small | 0.57 | ~0.04 / 0.07 baseline ratio |
| 3 | Smedium | 0.71 | ~0.05 / 0.07 baseline ratio |
| 4 | Medium | 1.0 | Baseline |
| 5 | Large | 1.71 | ~0.12 / 0.07 baseline ratio |
| 6 | Jumbo | 3.57 | ~0.25 / 0.07 baseline ratio |

---

## Length Multipliers & Folding Math

When braiding, extensions are folded in half at the root. The length multipliers explicitly account for this physical reality based on a standard 46-inch unfolded bundle.

| Pos | UI Label | Folded Length | Multiplier | Physical Reality |
|-----|:---------|:--------------|:-----------|:-----------------|
| 1 | **Ear** | 10" | `0.4` | Less than half of a bundle. |
| 2 | **Jaw** | 12" | `0.5` | Exactly half of a 23" bundle. |
| 3 | **Shoulder** | 24" | `1.0` | **One full bundle folded exactly in half.** (46" → 23/24") |
| 4 | **Mid-back** | 30" | `1.25` | One bundle + a quarter fed-in to extend. |
| 5 | **Waist** | 36" | `1.5` | One bundle + a half fed-in to extend. |
| 6 | **Hip** | 48" | `2.0` | Exactly doubled (two full bundles fed into each other). |

---

## Density Multipliers

Density represents scalp coverage — how many braids are installed. A higher density means more braids, which means more hair used.

| Pos | Label | Coefficient |
|-----|-------|-------------|
| 1 | Very Low | 0.5 |
| 2 | Low | 0.7 |
| 3 | Medium | 1.0 |
| 4 | Full | 2.0 |
| 5 | Very Full | 3.0 |

---

## Calibration Factor

The `calibrationFactor` is exposed to stylists via the Dev Kit (`DEV_CONFIG.calibrationFactor`, default `0.95`). It is a global scalar applied after all other multipliers, intended as a fine-tuning lever if real-world installs consistently run over or under the estimate.

- **Increasing** it (e.g. `1.05`) makes all estimates higher — useful if clients are running out of hair.
- **Decreasing** it (e.g. `0.85`) makes all estimates lower — useful if there's consistently too much left over.

Changing the factor does **not** affect the 3D rendering — it is purely a calculator output adjustment.

---

## UI Behaviour Notes

- **Sliders commit on release** (`onPointerUp` / `onRelease`). The local state (`localThickness`, `localLength`, `localDensity`) updates on every drag event so the result animates live, but the Zustand store only receives the final committed value when the user lifts their finger or releases the mouse. This avoids flooding the store with intermediate values.
- **Pack count display**: The large animated number shown in the result card is `Math.round(packsResult)`. The exact decimal is shown in a smaller label below as `x.xx exact bundles`.
- **Style selector**: Non-Box-Braids options render as disabled with an "IN DEVELOPMENT" tooltip. The `selectStyle()` action still works programmatically (e.g. via preset selection), it is just not user-triggerable from the style selector UI in the current build.
