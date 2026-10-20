<?php
/** AlphaCard block renderer. */
if (!defined('ABSPATH')) {
    exit;
}
require_once __DIR__ . '/tokens.php';

$card_id = (int) get_field('card');
$raw_values = get_field('token_values');
$runtime_data = isset($block['attrs']['data']) && is_array($block['attrs']['data'])
    ? $block['attrs']['data'] : array();
if (array_key_exists('card', $runtime_data)) {
    $card_id = (int) $runtime_data['card'];
}
if (array_key_exists('token_values', $runtime_data)) {
    $raw_values = $runtime_data['token_values'];
}

$card = $card_id ? get_post($card_id) : null;
if (!$card || $card->post_type !== 'card' || $card->post_status !== 'publish') {
    if (!empty($is_preview)) {
        echo '<p>Select a published Card to render AlphaCard.</p>';
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

$values = alphacard_parse_values($raw_values);
if (is_string($raw_values)) {
    $saved_state = json_decode($raw_values, true);
} else {
    $saved_state = $raw_values;
}
if (is_array($saved_state) && isset($saved_state['card']) && (int) $saved_state['card'] !== $card_id) {
    $values = array();
}
echo '<div class="alphacard">' . alphacard_render_markup(htmlspecialchars_decode($markup, ENT_QUOTES), $values) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted Card template, escaped local values.
