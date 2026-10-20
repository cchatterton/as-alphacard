<?php
// Standalone checks for token discovery and exact-value substitution.
define('ABSPATH', __DIR__);
require dirname(__DIR__) . '/alphacard/tokens.php';

$markup = '<a href="%%$post->post_permalink%%"><span style="background-image:url(\'%%$image->featured%%\')">%%$post->post_title%% / %%$post->post_title%%</span></a>';
$expected = array('$post->post_permalink', '$image->featured', '$post->post_title');
if (alphacard_find_tokens($markup) !== $expected) { throw new RuntimeException('Token discovery failed'); }
$values = array('$post->post_permalink' => '/robot', '$image->featured' => 'https://example.org/a.jpg', '$post->post_title' => '<i class="fa-solid fa-robot"></i>');
$rendered = alphacard_render_markup($markup, $values);
if ($rendered !== '<a href="/robot"><span style="background-image:url(\'https://example.org/a.jpg\')"><i class="fa-solid fa-robot"></i> / <i class="fa-solid fa-robot"></i></span></a>') {
    throw new RuntimeException('Raw rendering failed: ' . $rendered);
}
$state = json_encode(array('card' => 42, 'tokens' => $expected, 'values' => $values));
if (alphacard_parse_values($state) !== $values) { throw new RuntimeException('Value parsing failed'); }
$same_token = '<a href="%%link%%">%%link%%</a>';
if (alphacard_render_markup($same_token, array('link' => '/example')) !== '<a href="/example">/example</a>') {
    throw new RuntimeException('Repeated token context failed');
}
echo "Token checks passed\n";
