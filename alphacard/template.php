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

// Saved single-card blocks retain their content until moved into a repeater row.
if (!$cards && !array_key_exists('cards', $runtime_data)) {
    $legacy_card = array_key_exists('card', $runtime_data)
        ? $runtime_data['card'] : get_field('card');
    $legacy_values = array_key_exists('token_values', $runtime_data)
        ? $runtime_data['token_values'] : get_field('token_values');
    if ($legacy_card) {
        $cards[] = array('card' => $legacy_card, 'token_values' => $legacy_values);
    }
}

if (!$cards) {
    if (!empty($is_preview)) {
        echo '<p>Add a Card to render AlphaCard.</p>';
    }
    return;
}

echo '<div class="alphacard-group">';
foreach ($cards as $index => $item) {
    if (!is_array($item)) {
        continue;
    }
    $card_id = isset($item['card']) ? (int) $item['card'] : 0;
    $card = $card_id ? get_post($card_id) : null;
    if (!$card || $card->post_type !== 'card' || $card->post_status !== 'publish') {
        if (!empty($is_preview)) {
            echo '<p>Card ' . esc_html((string) ($index + 1)) . ': select a published Card.</p>';
        }
        continue;
    }

    $markup = get_post_meta($card_id, 'card_markup', true);
    if (!is_string($markup) || $markup === '') {
        if (!empty($is_preview)) {
            echo '<p>Card ' . esc_html((string) ($index + 1)) . ' has no markup.</p>';
        }
        continue;
    }

    $raw_values = isset($item['token_values']) ? $item['token_values'] : '';
    $saved_state = is_string($raw_values) ? json_decode($raw_values, true) : $raw_values;
    $values = alphacard_parse_values($raw_values);
    if (is_array($saved_state) && isset($saved_state['card']) && (int) $saved_state['card'] !== $card_id) {
        $values = array();
    }
    echo '<div class="alphacard">' . alphacard_render_markup(htmlspecialchars_decode($markup, ENT_QUOTES), $values) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- intentionally raw Card markup and local values.
}
echo '</div>';
