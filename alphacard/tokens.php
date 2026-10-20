<?php
/** Token discovery and local substitution for AlphaCard. */
if (!defined('ABSPATH')) {
    exit;
}

function alphacard_find_tokens($markup) {
    preg_match_all('/%%\s*([^%]+?)\s*%%/s', $markup, $matches);
    $tokens = array();
    foreach ($matches[1] as $expression) {
        $expression = trim($expression);
        if ($expression !== '' && !in_array($expression, $tokens, true)) {
            $tokens[] = $expression;
        }
    }
    return $tokens;
}

function alphacard_parse_values($raw) {
    if (is_string($raw)) {
        $raw = json_decode($raw, true);
    }
    if (!is_array($raw)) {
        return array();
    }
    $source = array_key_exists('card', $raw)
        ? (isset($raw['values']) && is_array($raw['values']) ? $raw['values'] : array())
        : $raw;
    $values = array();
    foreach ($source as $token => $value) {
        if (is_string($token) && is_scalar($value)) {
            $values[$token] = (string) $value;
        }
    }
    return $values;
}

function alphacard_render_markup($markup, $values) {
    preg_match_all('/%%\s*([^%]+?)\s*%%/s', $markup, $matches, PREG_OFFSET_CAPTURE);
    $rendered = '';
    $cursor = 0;
    foreach ($matches[0] as $index => $occurrence) {
        $offset = $occurrence[1];
        $rendered .= substr($markup, $cursor, $offset - $cursor);
        $token = trim($matches[1][$index][0]);
        $value = isset($values[$token]) ? $values[$token] : '';
        // Inspect the open tag immediately before this token. URL attributes and CSS url()
        // need protocol validation; other contexts receive HTML escaping.
        $prefix = substr($markup, 0, $offset);
        $tag_start = strrpos($prefix, '<');
        $tag_end = strrpos($prefix, '>');
        if ($tag_start !== false && ($tag_end === false || $tag_start > $tag_end)) {
            $attribute = substr($prefix, $tag_start);
            if (preg_match('/(?:href|src|action|poster)\s*=\s*(["\'])[^"\']*$/i', $attribute)
                || preg_match('/url\(\s*(["\'])?[^)"\']*$/i', $attribute)) {
                $rendered .= esc_url($value);
                $cursor = $offset + strlen($occurrence[0]);
                continue;
            }
        }
        $rendered .= esc_html($value);
        $cursor = $offset + strlen($occurrence[0]);
    }
    return $rendered . substr($markup, $cursor);
}
