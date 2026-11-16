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
$multiple_cards = count($cards) > 1;
if ($multiple_cards) {
    echo '<div class="alphacard-grid">';
}
foreach ($cards as $item) {
    if (!is_array($item)) {
        continue;
    }
    $values = alphacard_parse_values(isset($item['token_values']) ? $item['token_values'] : '');
    echo '<div class="alphacard">' . alphacard_render_markup($markup, $values) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- intentionally raw Card markup and local values.
}
if ($multiple_cards) {
    echo '</div>';
}
