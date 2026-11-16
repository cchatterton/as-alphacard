<?php
/** AlphaCard block renderer. */
if (!defined('ABSPATH')) {
    exit;
}
require_once __DIR__ . '/tokens.php';

$runtime_data = isset($block['attrs']['data']) && is_array($block['attrs']['data'])
    ? $block['attrs']['data'] : array();
$cards = get_field('cards');
$cards = is_array($cards) ? $cards : array();
if (isset($runtime_data['cards']) && is_array($runtime_data['cards'])) {
    $cards = $runtime_data['cards'];
}

$card_id = array_key_exists('card', $runtime_data)
    ? (int) $runtime_data['card'] : (int) get_field('field_alphacard_card');
// Blocks saved with per-row selectors use their first Card until the shared
// selector is saved in the editor.
if (!$card_id && $cards) {
    foreach ($cards as $item) {
        if (is_array($item) && !empty($item['card'])) {
            $card_id = (int) $item['card'];
            break;
        }
    }
}

$legacy_migrated = array_key_exists('legacy_migrated', $runtime_data)
    ? (bool) $runtime_data['legacy_migrated'] : (bool) get_field('legacy_migrated');
if (!$cards && !$legacy_migrated && $card_id) {
    $legacy_values = array_key_exists('token_values', $runtime_data)
        ? $runtime_data['token_values'] : get_field('token_values');
    if ($legacy_values !== false && $legacy_values !== null && $legacy_values !== '') {
        $cards[] = array('token_values' => $legacy_values);
    }
}

if (!$cards) {
    if (!empty($is_preview)) {
        echo '<p>Select a Card and add a row to render AlphaCard.</p>';
    }
    return;
}

$card = $card_id ? get_post($card_id) : null;
if (!$card || $card->post_type !== 'card' || $card->post_status !== 'publish') {
    if (!empty($is_preview)) {
        echo '<p>Select a published Card for AlphaCard.</p>';
    }
    return;
}
$markup = get_post_meta($card_id, 'card_markup', true);
if (!is_string($markup) || $markup === '') {
    if (!empty($is_preview)) {
        echo '<p>The selected Card has no markup.</p>';
    }
    return;
}
$markup = htmlspecialchars_decode($markup, ENT_QUOTES);
$cards = array_values(array_filter($cards, 'is_array'));
if (!$cards) {
    return;
}

$block_id = isset($block['id']) ? $block['id'] : uniqid('block_');
$block_classes = function_exists('block_classes') ? block_classes() : 'wp-block-acf-alphacard';
$block_classes = trim($block_classes . ' wp-block-acf-alphablock');
$card_slug = isset($card->post_name) ? sanitize_html_class($card->post_name) : '';
$card_classes = trim('magic_card alphacard ' . $card_slug);
$per_row = count($cards);

printf(
    '<div id="alphacard-%1$s" class="section-wrapper %2$s">' . "\n"
    . '  <div class="section-inner-wrapper">' . "\n"
    . '<div class="card-wrapper"><ul class="card-row card-layout-wrap-lg card-layout-wrap-sm" style="--per-row:%3$d;">',
    esc_attr($block_id),
    esc_attr($block_classes),
    $per_row
);

foreach ($cards as $item) {
    $values = alphacard_parse_values(isset($item['token_values']) ? $item['token_values'] : '');
    echo '<li class="card-item"><div class="' . esc_attr($card_classes) . '">'
        . alphacard_render_markup($markup, $values)
        . '</div></li>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- intentionally raw Card markup and local values.
}
echo '</ul></div>  </div>' . "\n" . '</div>' . "\n";
