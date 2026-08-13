# Design QA — Formula help popover

- source visual truth path: `C:\Users\Admin\.codex\generated_images\019ffbf0-efb1-7c02-8ab3-f21fcbe0db9a\exec-bfb52a04-cccc-45fb-bb2e-10d5c97529c8.png`
- implementation screenshot path: `E:\TINH GIA\tmp\design-qa\formula-detail-implementation.png`
- combined comparison path: `E:\TINH GIA\tmp\design-qa\formula-detail-comparison.png`
- viewport: implementation 1280 × 720 CSS px at density 1; source concept 1488 × 1058 px, proportionally reduced to 1013 × 720 for the combined comparison
- state: Tem nhãn, method 1 selected, empty calculator fields using the worked-example defaults (50 mm, 100 m, 9.200 đ/m², 5.000 đ/cuộn), detail popover open

## Full-view comparison evidence

The combined comparison shows the same right-anchored popover anatomy as the selected concept: compact header with calculator icon and close action, three numbered steps connected vertically, pale-green equations, field-value chips, rounded result, VAT pill, and the `Các số này lấy từ đâu?` mapping section. The implementation intentionally preserves the production app navigation and calculator behind the overlay.

## Focused region comparison evidence

The formula popover itself was checked at readable scale. Typography, thin green borders, pale-green fills, 8 px radii, number circles, equation hierarchy, result emphasis, and field mappings align with the source direction. The implementation is vertically compressed to fit the real 720 px laptop viewport without an internal scrollbar; this is an intentional responsive adaptation of the taller 1024 px concept.

## Findings

- No actionable P0, P1, or P2 differences remain.
- [P3] The source concept has slightly more vertical breathing room because it was generated for a 1024 px-high frame. The implementation uses compact spacing at 720 px so the entire popover remains visible without scrolling.

## Required fidelity surfaces

- Fonts and typography: Inter/Roboto Condensed hierarchy matches the existing product and keeps equations legible at laptop density.
- Spacing and layout rhythm: component structure matches the source; spacing is responsively compacted for 720 px height.
- Colors and visual tokens: existing `#123c20` / `#1a7540` palette, white surface, pale-green highlights, and restrained borders are preserved.
- Image quality and asset fidelity: no raster assets are required in this UI-only component; all icons use the project's existing Phosphor icon library.
- Copy and content: Vietnamese formula labels, rounding rule, VAT note, example values, and source-field mappings are present and method-specific.

## Primary interactions tested

- Hover/focus shows only the compact formula tooltip.
- Clicking the info icon hides the compact tooltip and opens the detailed worked-example popover.
- Clicking × closes the detail popover; clicking the icon reopens it.
- Escape closes the detail popover.
- Changing the pricing method closes the open detail popover and updates its content for the selected formula.
- No browser console errors were reported.

## Comparison history

1. Initial implementation reproduced the three-step flow but omitted the per-step value chips and `/ cuộn` result suffix.
2. Added labeled value chips under every equation, restored the fixed 5 mm source mapping, added the unit suffix, and widened the popover while keeping it within the 720 px viewport.
3. Final browser capture confirmed the compact tooltip and detailed popover do not overlap, the panel has no vertical overflow, and the revised component matches the selected hierarchy.

## Implementation checklist

- [x] Preserve the compact hover/focus tooltip.
- [x] Open the detailed option-3-style example only on click.
- [x] Support all Tem nhãn pricing methods with method-specific examples.
- [x] Close by ×, Escape, icon toggle, or method change.
- [x] Verify build, Sites packaging tests, browser interaction, and console output.

final result: passed
