<?php
// Exit if accessed directly
if (!defined('ABSPATH')) exit;

function sip_handle_creation_action() {
    $creation_action = isset($_POST['creation_action']) ? sanitize_text_field($_POST['creation_action']) : '';

    switch ($creation_action) {
        case 'update_new_product':
            sip_update_new_product_data();
            break;

        // Add other creation actions as needed

        default:
            wp_send_json_error('Unknown creation action.');
            break;
    }
}

// Fetch and return product data from a template
function sip_create_new_product_from_template() {
    check_ajax_referer('sip_printify_manager_nonce', 'nonce');

    $template_name = isset($_POST['template_name']) ? sanitize_text_field($_POST['template_name']) : '';

    $product_data = sip_get_template_json_from_file($template_name);
    if (!$product_data) wp_send_json_error('Template not found.');

    wp_send_json_success($product_data);
}
add_action('wp_ajax_sip_create_new_product_from_template', 'sip_create_new_product_from_template');

function sip_get_template_json_from_file($template_name) {
    $template_dir = sip_get_template_dir();
    error_log('Template Directory: ' . $template_dir);
    $file_path = $template_dir . $template_name . '.json';
    error_log('Template File Path: ' . $file_path);

    if (!file_exists($file_path)) {
        error_log('Template file does not exist at: ' . $file_path);
        return false;
    }

    $template_content = file_get_contents($file_path);
    return json_decode($template_content, true);
}

// Update product data based on user input
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

    wp_send_json_success('Product data updated successfully.');
}
add_action('wp_ajax_sip_update_new_product_data', 'sip_update_new_product_data');

// Create product on Printify
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
        wp_send_json_success('Product created successfully.');
    } else {
        wp_send_json_error('Error creating product: ' . $api_response['message']);
    }
}
add_action('wp_ajax_sip_create_product', 'sip_create_product');

// Placeholder for Printify API call
function sip_send_product_to_printify($product_data) {
    // Implement API call here
    return array(
        'success' => true,
    );
}
