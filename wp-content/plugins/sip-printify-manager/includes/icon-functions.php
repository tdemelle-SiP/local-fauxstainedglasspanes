<?php
// File: includes/icon-functions.php

/**
 * Generates SVG markup for sort icons
 *
 * @param string $type The type of icon to generate ('outline-up', 'outline-down', 'solid-up', 'solid-down')
 * @return string SVG markup for the requested icon
 */
function sip_get_sort_icon($type) {
    switch ($type) {
        case 'outline-up':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L10 10 L0 10 Z" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
        case 'outline-down':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0 L10 0 L5 10 Z" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
        case 'solid-up':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L10 10 L0 10 Z" fill="currentColor"/></svg>';
        case 'solid-down':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0 L10 0 L5 10 Z" fill="currentColor"/></svg>';
        case 'dim-up':
            return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L10 10 L0 10 Z" fill="#FFFFFF80" stroke="currentColor" stroke-width="1"/></svg>';
        case 'dim-down': 
            return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0 L10 0 L5 10 Z" fill="#FFFFFF80" stroke="currentColor" stroke-width="1"/></svg>';
            default:
            return '';
    }
}