<?php
/**
 * AlphaCard editor assets and token-discovery endpoint.
 * Loaded by the shared theme ACF block loader, like AlphaBlock/block.php.
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/tokens.php';

add_action('admin_enqueue_scripts', 'alphacard_enqueue_editor');
add_action('wp_ajax_alphacard_get_merge_tokens', 'alphacard_get_merge_tokens');

function alphacard_enqueue_editor() {
    if (!function_exists('acf_get_block_types')) {
        return;
    }

    wp_enqueue_script(
        'alphacard-editor',
        get_stylesheet_directory_uri() . '/blocks/alphacard/editor.js',
        array('jquery', 'acf-input'),
        '1.1.0',
        true
    );
    wp_enqueue_style(
        'alphacard-editor',
        get_stylesheet_directory_uri() . '/blocks/alphacard/editor.css',
        array(),
        '1.1.0'
    );
    wp_localize_script('alphacard-editor', 'alphaCardEditor', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('alphacard_get_merge_tokens'),
    ));
}

function alphacard_get_merge_tokens() {
    check_ajax_referer('alphacard_get_merge_tokens', 'nonce');
    if (!current_user_can('edit_posts')) {
        wp_send_json_error(array('message' => 'You cannot edit cards.'), 403);
    }

    $card_id = isset($_POST['card_id']) ? absint(wp_unslash($_POST['card_id'])) : 0;
    $card = get_post($card_id);
    if (!$card || $card->post_type !== 'card' || $card->post_status !== 'publish') {
        wp_send_json_error(array('message' => 'Select a published Card first.'), 400);
    }

    $markup = get_post_meta($card_id, 'card_markup', true);
    wp_send_json_success(array('tokens' => alphacard_find_tokens((string) $markup)));
}
