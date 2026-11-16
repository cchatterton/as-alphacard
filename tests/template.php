<?php
// Checks one template per block, row order, and legacy rendering.
define('ABSPATH', __DIR__);
$fields = array();
$posts = array(
    10 => (object) array('post_type' => 'card', 'post_status' => 'publish'),
    11 => (object) array('post_type' => 'card', 'post_status' => 'publish'),
);
$markup = array(10 => '<b>%%title%%</b>', 11 => '<i>%%title%%</i>');
function get_field($name) { global $fields; return isset($fields[$name]) ? $fields[$name] : false; }
function get_post($id) { global $posts; return isset($posts[$id]) ? $posts[$id] : null; }
function get_post_meta($id, $key, $single) { global $markup; return isset($markup[$id]) ? $markup[$id] : ''; }
function esc_html($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function render_alpha($data) {
    $block = array('attrs' => array('data' => $data));
    $is_preview = false;
    ob_start();
    include dirname(__DIR__) . '/alphacard/template.php';
    return ob_get_clean();
}
$fields['field_alphacard_card'] = 10;
$fields['cards'] = array(
    array('card' => 10, 'token_values' => json_encode(array('card' => 10, 'values' => array('title' => '<em>First</em>')))),
    array('card' => 11, 'token_values' => json_encode(array('card' => 11, 'values' => array('title' => 'Second')))),
);
if (render_alpha(array()) !== '<div class="alphacard-grid"><div class="alphacard"><b><em>First</em></b></div><div class="alphacard"><b>Second</b></div></div>') {
    throw new RuntimeException('Rows did not share one template');
}
if (render_alpha(array('card' => 11)) !== '<div class="alphacard-grid"><div class="alphacard"><i><em>First</em></i></div><div class="alphacard"><i>Second</i></div></div>') {
    throw new RuntimeException('Shared template swap did not retain matching values');
}
$fields['field_alphacard_card'] = false;
if (render_alpha(array()) !== '<div class="alphacard-grid"><div class="alphacard"><b><em>First</em></b></div><div class="alphacard"><b>Second</b></div></div>') {
    throw new RuntimeException('Existing per-row blocks did not fall back to their first Card');
}
$fields['cards'] = false;
$fields['field_alphacard_card'] = 10;
$fields['token_values'] = json_encode(array('card' => 10, 'values' => array('title' => 'Legacy')));
if (render_alpha(array()) !== '<div class="alphacard"><b>Legacy</b></div>') {
    throw new RuntimeException('Legacy single Card was not preserved');
}
if (render_alpha(array('cards' => '0')) !== '<div class="alphacard"><b>Legacy</b></div>') {
    throw new RuntimeException('Saving a blank repeater lost the legacy Card');
}
if (render_alpha(array('cards' => '0', 'legacy_migrated' => '1')) !== '') {
    throw new RuntimeException('Removed migrated Cards restored legacy content');
}
$fields['token_values'] = '';
if (render_alpha(array()) !== '') {
    throw new RuntimeException('An empty new block rendered without a row');
}
echo "Template checks passed\n";
