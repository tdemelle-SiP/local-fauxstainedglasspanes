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
        case 'get_loaded_template':
            sip_get_loaded_template();
            break;
        case 'set_loaded_template':
            sip_set_loaded_template();
            break;
        case 'save_template':
            sip_save_template_content();
            break;
        case 'close_template':
            delete_option('sip_loaded_template');
            wp_send_json_success(array(
                'action' => 'close_template',
                'message' => 'Template closed successfully'
            ));
            break;           
        // case 'get_initial_table_html':
        //     wp_send_json_success(array('initial_html' => '{{INITIAL_TABLE_HTML_PLACEHOLDER}}'));
        //     break; 

        default:
            wp_send_json_error('Unknown creation action.');
            break;
    }
}


/**
 * Get the loaded template data.
 */
function sip_get_loaded_template() {
    $loaded_template = get_option('sip_loaded_template', '');
    if (!empty($loaded_template)) {
        wp_send_json_success(array(
            'action' => 'get_loaded_template',
            'template_data' => json_decode($loaded_template, true)
        ));
    } else {
        wp_send_json_success(array(
            'action' => 'get_loaded_template',
            'template_data' => null
        ));
    }
}

/**
 * Set the loaded template data.
 */
function sip_set_loaded_template() {
    if (!isset($_POST['template_data'])) {
        wp_send_json_error('No template data provided');
    }
    $template_data = wp_unslash($_POST['template_data']);
    update_option('sip_loaded_template', $template_data);
    wp_send_json_success(array(
        'action' => 'set_loaded_template',
        'message' => 'Template data saved successfully'
    ));
}

/**
 * Update product data based on user input.
 */
function sip_update_new_product_data() {
    check_ajax_referer('sip_printify_manager_nonce', 'nonce');

    $updated_data = $_POST['updated_data'];
    $key = sanitize_text_field($updated_data['key']);
    $value = sanitize_text_field($updated_data['value']);
    $template_name = sanitize_text_field($updated_data['template_name']);

    $user_id = get_current_user_id();
    $transient_key = 'sip_new_product_data_' . $user_id . '_' . $template_name;

    $product_data = get_transient($transient_key);
    if (!$product_data) {
        $product_data = sip_get_template_json_from_file($template_name);
        if (!$product_data) wp_send_json_error('Template not found.');
    }

    // Update product data
    if ($key === 'title') {
        $product_data['title'] = $value;
    } elseif ($key === 'description') {
        $product_data['description'] = $value;
    } elseif ($key === 'tags') {
        $product_data['tags'] = array_map('trim', explode(',', $value));
    }

    set_transient($transient_key, $product_data, HOUR_IN_SECONDS);

    wp_send_json_success(array(
        'action' => 'update_new_product',
        'message' => 'Product data updated successfully.'
    ));
}

/**
 * Create a new product on Printify.
 */
function sip_create_product() {
    check_ajax_referer('sip_printify_manager_nonce', 'nonce');

    $template_name = sanitize_text_field($_POST['template_name']);
    $user_id = get_current_user_id();
    $transient_key = 'sip_new_product_data_' . $user_id . '_' . $template_name;

    $product_data = get_transient($transient_key);
    if (!$product_data) wp_send_json_error('No product data found.');

    $api_response = sip_send_product_to_printify($product_data);

    if ($api_response['success']) {
        delete_transient($transient_key);
        wp_send_json_success(array(
            'action' => 'create_product',
            'message' => 'Product created successfully.'
        ));
    } else {
        wp_send_json_error(array(
            'action' => 'create_product',
            'message' => 'Error creating product: ' . $api_response['message']
        ));
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
    return array(
        'success' => true,
        'message' => 'Product sent to Printify successfully'
    );
}

/**
 * Save the edited template content from the template editor.
 */
function sip_save_template_content() {
    check_ajax_referer('sip_printify_manager_nonce', '_ajax_nonce');

    $template_name    = sanitize_text_field($_POST['template_name']);
    $template_content = wp_unslash($_POST['template_content']);
    $file_path        = sip_get_template_dir() . $template_name . '.json';

    if (file_exists($file_path)) {
        if (file_put_contents($file_path, $template_content)) {
            wp_send_json_success(array(
                'action' => 'save_template',
                'message' => 'Template saved successfully.'
            ));
        } else {
            wp_send_json_error(array(
                'action' => 'save_template',
                'message' => 'Failed to save template.'
            ));
        }
    } else {
        wp_send_json_error(array(
            'action' => 'save_template',
            'message' => 'Template file not found.'
        ));
    }
}