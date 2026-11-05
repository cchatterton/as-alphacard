# AlphaCard

AlphaCard is an ACF theme block for rendering one published `card` template with values entered on the page. It complements [AlphaBlock](https://github.com/cchatterton/as-alphablock), which queries posts and renders Cards using `Magic_Card`.

## Install

Copy `alphacard/` into the active theme's `blocks/` directory. Use the same shared ACF block loader as AlphaBlock to register `blocks/*/block.json`, load the adjacent ACF JSON field group, and include `block.php`. Requires WordPress, ACF PRO with block support, and the theme's `card` custom post type with templates in `card_markup` post meta. This is a theme component, not a standalone plugin. No `Magic_Card` dependency is needed.

## Edit a page

1. Add AlphaCard, click **Add Card**, and select a published Card in the new row.
2. The editor loads its merge tokens automatically. **Get merge tokens** refreshes the fields if the Card template changes.
3. Enter text, HTML, or URLs as needed, then save the page. Each row stores its values in its own `token_values` ACF subfield as JSON.
4. Add, reorder, or remove Card rows using the native ACF repeater controls. Cards render in row order.

When a row changes to another Card, values for tokens with the same name are carried over. The remaining non-empty values appear under **Non-matching content** as copyable text. They remain saved with the row and are restored if a later Card uses those token names again.

Previously saved single-card blocks continue to render. In the editor, **Move existing Card into list** copies the saved Card and values into the first repeater row. Save the page to complete that move.

Example: a template containing `%%$post->post_title%%` and `%%$image->featured%%` gets two local inputs. These names are treated as literal keys; AlphaCard does not query a post, ACF field, or featured image to resolve them.

The block renders each selected Card's markup with local substitutions. Missing values become empty strings. Values are inserted exactly as entered, including HTML markup, into text or attribute positions. Editors should use the inputs in the context of the Card template. Card template markup is administrator-authored content, as in AlphaBlock's Card workflow. An unpublished or missing Card renders nothing on the public page and shows guidance in editor preview.

## Development

Run `php tests/tokens.php`, `php -l` on PHP files, `node --check alphacard/editor.js`, and JSON validation before release. Live WordPress and ACF editor integration should be checked after installing the block in the target theme.
