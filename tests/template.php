<?php
// Checks ordered repeater output and compatibility with saved single-card blocks.
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
$fields['cards'] = array(
    array('card' => 10, 'token_values' => json_encode(array('card' => 10, 'values' => array('title' => '<em>First</em>')))),
    array('card' => 11, 'token_values' => json_encode(array('card' => 11, 'values' => array('title' => 'Second')))),
);
if (render_alpha(array()) !== '<div class="alphacard-group"><div class="alphacard"><b><em>First</em></b></div><div class="alphacard"><i>Second</i></div></div>') {
    throw new RuntimeException('Repeater cards did not render in order');
}
$fields['cards'] = false;
$fields['card'] = 10;
$fields['token_values'] = json_encode(array('card' => 10, 'values' => array('title' => 'Legacy')));
if (render_alpha(array()) !== '<div class="alphacard-group"><div class="alphacard"><b>Legacy</b></div></div>') {
    throw new RuntimeException('Legacy card was not preserved');
}
if (render_alpha(array('cards' => '0')) !== '') {
    throw new RuntimeException('Removed cards unexpectedly restored legacy content');
}
echo "Template checks passed\n";
