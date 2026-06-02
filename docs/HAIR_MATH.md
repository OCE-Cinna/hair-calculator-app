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

When a user selects Box Braids + Medium Thickness + Medium Density + Shoulder Length, the algorithm outputs exactly what is mathematically required for that specific baseline.

## Length Multipliers & Folding Math

When braiding, extensions are folded in half at the root. The length multipliers explicitly account for this physical reality based on a standard 46-inch unfolded bundle.

| UI Label | Folded Length | Multiplier | Physical Reality |
| :--- | :--- | :--- | :--- |
| **Ear** | 10" | `0.4` | Less than half of a bundle. |
| **Jaw** | 12" | `0.5` | Exactly half of a 23" bundle. |
| **Shoulder** | 24" | `1.0` | **One full bundle folded exactly in half.** (46" → 23/24") |
| **Mid-back** | 30" | `1.25` | One bundle + a quarter fed-in to extend. |
| **Waist** | 36" | `1.5` | One bundle + a half fed-in to extend. |
| **Hip** | 48" | `2.0` | Exactly doubled (two full bundles fed into each other). |

## The Formula

The calculation uses the following formula to process the multipliers from `hairStore.js`:

```javascript
Estimated Bundles = (Style + Thickness + Density) * Length * CalibrationFactor
```

The `CalibrationFactor` (default `0.95` in the Dev Kit) acts as a mathematical anchor to ensure that the sum of the `1.0` baseline multipliers correctly evaluates to the real-world bundle requirements for a standard medium box braid install.
