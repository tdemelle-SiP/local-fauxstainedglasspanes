<?php
// Exit if accessed directly
if (!defined('ABSPATH')) exit;

/**
 * Handle creation actions triggered via AJAX.
 */
function sip_handle_creation_action() {
    $creation_action = isset($_POST['creation_action']) ? sanitize_text_field($_POST['creation_action']) : '';

    switch ($creation_action) {
        case 'update_new_product':
            sip_update_new_product_data();
            break;

        case 'create_product':
            sip_create_product();
            break;

        case 'edit_json':
            $template_name = isset($_POST['template_name']) ? sanitize_text_field($_POST['template_name']) : '';
            error_log("Template name received: " . $template_name);
            
            $wip = sip_get_wip_template();
            error_log("WIP result: " . print_r($wip, true));
            
            if ($wip) {
                wp_send_json_success([
                    'action' => 'edit_json',
                    'template_data' => $wip['data']
                ]);
            } else {
                // If no WIP exists but we have a template name, try to create WIP
                if ($template_name) {
                    $template_path = wp_upload_dir()['basedir'] . '/sip-printify-manager/templates/' . $template_name . '.json';
                    error_log("Looking for template at: " . $template_path);
                    
                    if (file_exists($template_path)) {
                        $wip_dir = sip_create_wip_directory();
                        $wip_path = $wip_dir . '/' . $template_name . '_wip.json';
                        error_log("Creating WIP at: " . $wip_path);
                        
                        if (copy($template_path, $wip_path)) {
                            $template_data = json_decode(file_get_contents($wip_path), true);
                            wp_send_json_success([
                                'action' => 'edit_json',
                                'template_data' => $template_data
                            ]);
                        }
                    }
                    error_log("Template file not found at: " . $template_path);
                }
                wp_send_json_error('No template loaded to edit.');
            }
            break;

        case 'check_wip_template':
        case 'get_current_template':
            $wip = sip_get_wip_template();
            wp_send_json_success([
                'action' => $creation_action,
                'template_data' => $wip ? $wip['data'] : null
            ]);
            break;

        case 'load_creation_editor_template':
            sip_load_creation_editor_template();
            break;

        case 'save_creation_editor_template':
            sip_save_creation_editor_template();
            break;

        case 'close_creation_editor':
            sip_close_creation_editor();
            break;

        default:
            wp_send_json_error('Unknown creation action.');
            break;
    }
}

/**
 * Creates and returns the WIP directory path
 */
function sip_create_wip_directory() {
    $wip_dir = wp_upload_dir()['basedir'] . '/sip-printify-manager/templates/wip';
    if (!file_exists($wip_dir)) {
        wp_mkdir_p($wip_dir);
    }
    return $wip_dir;
}

/**
 * Core function to get WIP template data
 */
function sip_get_wip_template() {
    $wip_dir = wp_upload_dir()['basedir'] . '/sip-printify-manager/templates/wip';
    $wip_files = glob($wip_dir . '/*_wip.json');
    
    error_log("Found WIP files: " . print_r($wip_files, true));
    
    if (!empty($wip_files)) {
        $wip_path = $wip_files[0];
        $content = file_get_contents($wip_path);
        $data = json_decode($content, true);
        
        error_log("WIP path: " . $wip_path);
        error_log("WIP content: " . $content);
        
        if ($content && $data) {
            return [
                'path' => $wip_path,
                'data' => $data
            ];
        } else {
            error_log("Invalid or empty WIP file found");
            // Clean up invalid WIP file
            unlink($wip_path);
            return null;
        }
    }
    return null;
}

/**
 * Loads a template and creates a working copy
 */
function sip_load_creation_editor_template() {
    $template_name = sanitize_text_field($_POST['template_name']);
    $template_path = wp_upload_dir()['basedir'] . '/sip-printify-manager/templates/' . $template_name . '.json';
    
    if (!file_exists($template_path)) {
        wp_send_json_error('Template file not found');
    }

    $wip_dir = sip_create_wip_directory();
    $wip_path = $wip_dir . '/' . $template_name . '_wip.json';
    
    if (copy($template_path, $wip_path)) {
        wp_send_json_success([
            'action' => 'load_creation_editor_template',
            'template_data' => json_decode(file_get_contents($wip_path), true)
        ]);
    } else {
        wp_send_json_error('Failed to create working copy');
    }
}

/**
 * Saves working copy to permanent template
 */
function sip_save_creation_editor_template() {
    $template_name = sanitize_text_field($_POST['template_name']);
    $wip_path = sip_create_wip_directory() . '/' . $template_name . '_wip.json';
    $template_data = wp_unslash($_POST['template_data']);
    
    if (file_put_contents($wip_path, $template_data)) {
        wp_send_json_success([
            'action' => 'save_creation_editor_template',
            'message' => 'Template saved'
        ]);
    } else {
        wp_send_json_error('Failed to save template');
    }
}

/**
 * Closes the creation editor
 */
function sip_close_creation_editor() {
    $template_name = sanitize_text_field($_POST['template_name']);
    $wip_path = sip_create_wip_directory() . '/' . $template_name . '_wip.json';
    
    if ($_POST['save_changes'] === 'true') {
        $permanent_path = wp_upload_dir()['basedir'] . '/sip-printify-manager/templates/' . $template_name . '.json';
        copy($wip_path, $permanent_path);
    }
    
    if (file_exists($wip_path)) {
        unlink($wip_path);
    }
    
    wp_send_json_success([
        'action' => 'close_creation_editor',
        'message' => 'Editor closed'
    ]);
}

/**
 * Update product data based on user input.
 */
function sip_update_new_product_data() {
    check_ajax_referer('sip_printify_manager_nonce', 'nonce');

    $key = sanitize_text_field($_POST['updated_data']['key']);
    $value = sanitize_text_field($_POST['updated_data']['value']);
    
    $wip = sip_get_wip_template();
    if (!$wip) {
        wp_send_json_error('No working template found.');
    }

    $product_data = $wip['data'];
    
    if ($key === 'title') {
        $product_data['title'] = $value;
    } elseif ($key === 'description') {
        $product_data['description'] = $value;
    } elseif ($key === 'tags') {
        $product_data['tags'] = array_map('trim', explode(',', $value));
    }

    if (file_put_contents($wip['path'], json_encode($product_data))) {
        wp_send_json_success([
            'action' => 'update_new_product',
            'message' => 'Product data updated successfully.'
        ]);
    } else {
        wp_send_json_error('Failed to save product data.');
    }
}

/**
 * Create a new product on Printify.
 */
function sip_create_product() {
    check_ajax_referer('sip_printify_manager_nonce', 'nonce');

    $wip = sip_get_wip_template();
    if (!$wip) {
        wp_send_json_error('No product data found.');
    }

    $api_response = sip_send_product_to_printify($wip['data']);

    if ($api_response['success']) {
        unlink($wip['path']); // Clean up WIP file after successful creation
        wp_send_json_success([
            'action' => 'create_product',
            'message' => 'Product created successfully.'
        ]);
    } else {
        wp_send_json_error([
            'action' => 'create_product',
            'message' => 'Error creating product: ' . $api_response['message']
        ]);
    }
}

/**
 * Send product data to Printify API.
 *
 * @param array $product_data The product data to send to Printify.
 * @return array The API response.
 */
function sip_send_product_to_printify($product_data) {
    // TODO: Implement actual API call to Printify
    // This is a placeholder implementation
    return [
        'success' => true,
        'message' => 'Product sent to Printify successfully'
    ];
}