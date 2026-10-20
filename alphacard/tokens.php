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
    return preg_replace_callback('/%%\s*([^%]+?)\s*%%/s', function ($match) use ($values) {
        $token = trim($match[1]);
        return isset($values[$token]) ? $values[$token] : '';
    }, $markup);
}
