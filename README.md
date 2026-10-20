# AlphaCard

AlphaCard is an ACF theme block for rendering one published `card` template with values entered on the page. It complements [AlphaBlock](https://github.com/cchatterton/as-alphablock), which queries posts and renders Cards using `Magic_Card`.

## Install

Copy `alphacard/` into the active theme's `blocks/` directory. Use the same shared ACF block loader as AlphaBlock to register `blocks/*/block.json`, load the adjacent ACF JSON field group, and include `block.php`. Requires WordPress, ACF PRO with block support, and the theme's `card` custom post type with templates in `card_markup` post meta. This is a theme component, not a standalone plugin. No `Magic_Card` dependency is needed.

## Edit a page

1. Add AlphaCard and select a published Card.
2. Click **Get merge tokens**. The editor sends an authenticated AJAX request, reads that Card's `card_markup`, and creates one value input for each unique `%%...%%` token.
3. Enter text, HTML, or URLs as needed, then save the page. The values are stored in the block's `token_values` ACF field as JSON. Each AlphaCard instance keeps its own values.
4. If the Card template changes, click **Get merge tokens** again to refresh the inputs. Matching values are preserved.

Example: a template containing `%%$post->post_title%%` and `%%$image->featured%%` gets two local inputs. These names are treated as literal keys; AlphaCard does not query a post, ACF field, or featured image to resolve them.

The block renders the selected Card's markup with local substitutions. Missing values become empty strings. Values are inserted exactly as entered, including HTML markup, into text or attribute positions. Editors should use the inputs in the context of the Card template. Card template markup is administrator-authored content, as in AlphaBlock's Card workflow. An unpublished or missing Card renders nothing on the public page and shows guidance in editor preview.

## Development

Run `php tests/tokens.php`, `php -l` on PHP files, `node --check alphacard/editor.js`, and JSON validation before release. Live WordPress and ACF editor integration should be checked after installing the block in the target theme.
