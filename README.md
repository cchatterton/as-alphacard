# AlphaCard

AlphaCard is an ACF theme block for rendering one published `card` template with values entered on the page. It complements [AlphaBlock](https://github.com/cchatterton/as-alphablock), which queries posts and renders Cards using `Magic_Card`.

## Install

Copy `alphacard/` into the active theme's `blocks/` directory. Use the same shared ACF block loader as AlphaBlock to register `blocks/*/block.json`, load the adjacent ACF JSON field group, and include `block.php`. Requires WordPress, ACF PRO with block support, and the theme's `card` custom post type with templates in `card_markup` post meta. This is a theme component, not a standalone plugin. No `Magic_Card` dependency is needed.

## Edit a page

1. Add AlphaCard and select one published Card template at the top of the block.
2. Click **Get merge tokens**. The token list applies to every row.
3. Click **Add Card** for each instance and enter its own text, HTML, or URL values.
4. Add, reorder, or remove rows using the native ACF repeater controls. Rows render in order and use the same Card template. AlphaCard uses AlphaBlock's section, card row, card item, and `magic_card` wrappers so the theme's existing card layout styles apply. All Cards share one row on large screens and wrap on small screens.

Changing the shared Card template refreshes the token list for every row. Matching token names keep their values. Other non-empty values remain under **Non-matching content** in that row for copying, and are restored if a later template uses those token names.

Previously saved single-card blocks continue to render. **Move existing Card into list** copies their local values into a row when needed. Blocks saved with the earlier per-row Card selectors use the first row's Card as their shared template until the top-level selection is saved. Review any earlier block that deliberately mixed different templates within one repeater.

Example: a template containing `%%$post->post_title%%` and `%%$image->featured%%` creates those two inputs in every row. The names are literal keys; AlphaCard does not query a post, ACF field, or featured image to resolve them.

Values are inserted exactly as entered, including HTML markup, into text or attribute positions. Card template markup is administrator-authored content, as in AlphaBlock's Card workflow. An unpublished or missing Card renders nothing on the public page and shows guidance in editor preview.

## Development

Run `php tests/tokens.php`, `php -l` on PHP files, `node --check alphacard/editor.js`, and JSON validation before release. Live WordPress and ACF editor integration should be checked after installing the block in the target theme.
