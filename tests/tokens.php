<?php
// Standalone checks for token discovery and context escaping.
define('ABSPATH', __DIR__);
function esc_html($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function esc_url($value) { return preg_match('~^https?://~', $value) ? htmlspecialchars($value, ENT_QUOTES, 'UTF-8') : ''; }
require dirname(__DIR__) . '/alphacard/tokens.php';

$markup = '<a href="%%$post->post_permalink%%"><span style="background-image:url(\'%%$image->featured%%\')">%%$post->post_title%% / %%$post->post_title%%</span></a>';
$expected = array('$post->post_permalink', '$image->featured', '$post->post_title');
if (alphacard_find_tokens($markup) !== $expected) { throw new RuntimeException('Token discovery failed'); }
$values = array('$post->post_permalink' => 'javascript:alert(1)', '$image->featured' => 'https://example.org/a.jpg', '$post->post_title' => '<Hello> & "world"');
$rendered = alphacard_render_markup($markup, $values);
if (strpos($rendered, 'javascript:') !== false || strpos($rendered, '&lt;Hello&gt; &amp; &quot;world&quot;') === false || strpos($rendered, 'https://example.org/a.jpg') === false) {
    throw new RuntimeException('Rendering or escaping failed: ' . $rendered);
}
$state = json_encode(array('card' => 42, 'tokens' => $expected, 'values' => $values));
if (alphacard_parse_values($state) !== $values) { throw new RuntimeException('Value parsing failed'); }
$same_token = '<a href="%%link%%">%%link%%</a>';
if (alphacard_render_markup($same_token, array('link' => 'javascript:alert(1)')) !== '<a href="">javascript:alert(1)</a>') {
    throw new RuntimeException('Repeated token context failed');
}
echo "Token checks passed\n";
