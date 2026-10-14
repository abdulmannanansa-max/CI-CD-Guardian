# CI/CD Guardian

CI/CD Guardian connects to a GitHub repository, inspects its workflows and run history, detects reliability and security issues, and combines heuristic risk scoring with Gemini analysis.

## Design system

The visual system lives in [`src/styles/tokens.css`](src/styles/tokens.css). It defines the aubergine ink surfaces, magenta/ultraviolet brand colors, apricot highlight, mint success, flare red danger, cyan info, typography, easing, and motion timing. `src/index.css` contains the component and responsive layer.

To retheme the product, change the tokens first:

- `--ink`, `--surface`, `--raised`, `--paper` control the surface hierarchy.
- `--primary`, `--secondary`, and `--highlight` control the poster gradients and active states.
- `--motion-factor` controls animation intensity.

Motion can be configured with `data-motion` on the root element:

```html
<html data-motion="full">      <!-- default -->
<html data-motion="reduced">   <!-- softer transitions -->
<html data-motion="off">       <!-- no movement -->
```

The app also respects `prefers-reduced-motion` automatically.

## Responsive checklist

- [x] 360px / 390px: single-column content, bottom navigation, safe-area padding, no page overflow.
- [x] 768px: compact icon navigation rail and stacked analysis panels.
- [x] 1024px: compact rail with multi-column content where space allows.
- [x] 1280px: full navigation rail and desktop bento layout.
- [x] 1536px / 1920px / 2560px: fluid type scale, constrained readable content, expanded panel heights.

Use `npm run build` to verify the production bundle.
