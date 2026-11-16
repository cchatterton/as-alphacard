# Changelog

## 1.2.3 - 2026-11-16

- Stretch the Card template root to fill its AlphaBlock-compatible Card slot, including templates rooted at a `div`.

## 1.2.2 - 2026-11-16

- Size the AlphaBlock-compatible desktop card row to the number of Cards, keeping all instances on one row.

## 1.2.1 - 2026-11-16

- Render AlphaCard rows with AlphaBlock's section and Card wrappers so the existing theme styles control the layout.
- Remove the custom AlphaCard grid stylesheet.

## 1.2.0 - 2026-11-16

- Select one Card template per AlphaCard block and repeat only its local content.
- Carry matching token values across template changes for every row.
- Keep blocks saved with per-row Card selections rendering through their first template until the shared selector is saved.

## 1.1.3 - 2026-11-16

- Lay out multiple Cards in a responsive grid while preserving single-card markup.

## 1.1.2 - 2026-11-06

- Keep existing single-card blocks rendering if saved with an empty repeater; mark them migrated only after moving their content into a row.

## 1.1.1 - 2026-11-06

- Preserve the original frontend wrapper for existing single-card blocks while rendering repeater Cards in sequence.

## 1.1.0 - 2026-11-06

- Add native ACF repeater rows so one AlphaCard block can render multiple Cards in order.
- Carry shared token values across Card changes and retain other values in a Non-matching content section.
- Keep existing single-card blocks renderable and offer an editor action to move them into the repeater.

## 1.0.2 - 2026-10-20

- Insert local merge-token values exactly as entered, allowing HTML content in Card output.

## 1.0.1 - 2026-10-20

- Read the selected Card through ACF's Post Object field model, with a DOM fallback, so token discovery recognises Select2 selections.

## 1.0.0 - 2026-10-20

- Add an ACF AlphaCard theme block with AJAX token discovery, per-block manual values, and local Card rendering.
