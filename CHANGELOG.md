# Changelog

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
