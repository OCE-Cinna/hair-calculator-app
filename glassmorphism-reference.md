# Glassmorphism Reference Guide (Tailwind CSS v4)

This document serves as a technical reference for implementing Glassmorphism within the Hair Calculator App. Glassmorphism is an aesthetic defined by a specific stack of CSS properties that interact with layers beneath them to create an illusion of depth, transparency, and diffusion.

## 1. Visual Logic: The "Stack"
Glassmorphism is defined by four core technical pillars:

- **Translucency:** The background color must have low opacity.
- **Diffusion:** A `backdrop-blur` is applied to the element to "frost" the content behind it.
- **Edge Definition:** A thin, semi-transparent border mimics the way light hits the edge of glass.
- **Vibrancy:** The effect only works if the background behind the glass contains high-contrast shapes or colors.

## 2. Technical Breakdown for Tailwind v4

| Component | Tailwind v4 Utility | Technical Logic | Example Implementation |
| :--- | :--- | :--- | :--- |
| **Surface** | `bg-white/30` or `bg-opacity-20` | Use a low-opacity white or gray to create the "sheet" of glass. | `bg-white/20` |
| **Blur** | `backdrop-blur-{size}` | The engine calculates pixels behind the element and applies a Gaussian blur. | `backdrop-blur-md` |
| **Border** | `border border-white/20` | A subtle 1px border provides the "cut glass" look. | `border border-white/30` |
| **Shadow** | `shadow-{size}` | Adds depth. Use a soft, large shadow to suggest the glass is floating. | `shadow-xl` |
| **Color Space** | `bg-oklch(...)` | V4 supports OKLCH natively for more perceptually uniform transparency. | `bg-[oklch(1_0_0/0.1)]` |
| **Saturation** | `backdrop-saturate-{percent}` | Optional: Increasing saturation makes the blurred colors pop more. | `backdrop-saturate-150` |

## 3. Implementation Example

When implementing a glassmorphic container, use the following structure:

```html
<!-- The Background (Requires vibrant colors/gradients) -->
<div class="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
  
  <!-- The Glassmorphic Card -->
  <div class="max-w-md p-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl backdrop-saturate-150">
    <h2 class="text-white text-2xl font-bold mb-4">Glassmorphism v4</h2>
    <p class="text-white/80 leading-relaxed">
      This card uses a high blur radius and low-opacity background to achieve 
      the frosted glass effect native to modern UI design.
    </p>
  </div>

</div>
```

## 4. Optimization & Best Practices

### Performance
`backdrop-blur` is resource-heavy, particularly on mobile devices. 
- Use it sparingly on large surfaces.
- Avoid nesting multiple glass layers with high blur values.

### Accessibility
Pure glassmorphism often fails WCAG contrast ratios. 
- Always provide a fallback background color.
- Consider users who prefer "Reduced Motion" or "High Contrast" settings by using the `motion-safe` or high-contrast media queries.

### Layering
- Ensure the `z-index` is managed so the "glass" sits above vibrant colors or complex backgrounds.
- The effect is nearly invisible over flat black or flat white backgrounds.

## 5. Quick Snippet (React/JSX)
```jsx
const GlassCard = ({ children }) => (
  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl backdrop-saturate-150 p-6">
    {children}
  </div>
);
```