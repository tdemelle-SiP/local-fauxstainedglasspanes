<?php
// Exit if accessed directly
if (!defined('ABSPATH')) exit;

function sip_handle_template_editor() {
    if (!isset($_POST['template_editor'])) {
        wp_send_json_error('Missing template editor action');
        return;
    }

    $action = $_POST['template_editor'];

    switch ($action) {
        case 'json_editor_save_template':
            sip_json_editor_save_template();
            break;
        case 'json_editor_close_template':
            sip_json_editor_close_template();
            break;
        default:
            wp_send_json_error('Unknown template editor action: ' . $action);
    }
}

function sip_json_editor_save_template() {
    $template_name = sanitize_text_field($_POST['template_name']);
    $wip_path = sip_create_wip_directory() . '/' . $template_name . '_wip.json';
    $template_data = wp_unslash($_POST['template_content']);  // Match what JS sends
    
    if (file_put_contents($wip_path, $template_data)) {
        wp_send_json_success([
            'action' => 'json_editor_save',
            'message' => 'Changes saved to working copy'
        ]);
    } else {
        wp_send_json_error('Failed to save changes');
    }
}

function sip_json_editor_close_template() {
    wp_send_json_success([
        'action' => 'json_editor_close',
        'message' => 'JSON editor closed'
    ]);
}