<?php
// Exit if accessed directly
if (!defined('ABSPATH')) exit;

/**
 * Handle creation actions triggered via AJAX.
 */
function sip_handle_template_editor() {
    $creation_action = isset($_POST['template_editor']) ? sanitize_text_field($_POST['creation_action']) : '';

    switch ($template_editor) {
        case 'json_editor_edit_template':
            sip_json_editor_edit_template();
            break;
        // case 'editor_save_template':
        //     sip_editor_save_template();
        //     break;
        // case 'editor_close_template':
        //     sip_editor_close_template();
        //     break;

        // JSON Editor actions
        case 'json_editor_save_template':
            sip_json_editor_save_template();
            break;
        case 'json_editor_close_template':
            sip_json_editor_close_template();
            break;


        default:
            wp_send_json_error('Unknown template editor action.');
            break;
    }
}

function sip_json_editor_edit_template() {
    wp_send_json_success(array(
        'action' => 'editor_edit_template',
        'message' => 'Template edited successfully'
    ));
}


// function sip_editor_save_template() {
//     wp_send_json_success(array(
//         'action' => 'editor_save_template',
//         'message' => 'Template saved successfully'
//     ));
// }

// function sip_editor_close_template() {
//     wp_send_json_success(array(
//         'action' => 'editor_close_template',
//         'message' => 'Template closed successfully'
//     ));
// }

/**
 * Saves JSON editor changes to working copy
 */
function sip_json_editor_save_template() {
    $template_name = sanitize_text_field($_POST['template_name']);
    $wip_path = sip_create_wip_directory() . '/' . $template_name . '_wip.json';
    $template_data = wp_unslash($_POST['template_data']);
    
    if (file_put_contents($wip_path, $template_data)) {
        wp_send_json_success([
            'action' => 'json_editor_save_template',
            'message' => 'Changes saved to working copy'
        ]);
    } else {
        wp_send_json_error('Failed to save changes');
    }
}

/**
 * Closes the JSON editor
 */
function sip_json_editor_close_template() {
    wp_send_json_success([
        'action' => 'json_editor_close_template',
        'message' => 'JSON editor closed'
    ]);
}