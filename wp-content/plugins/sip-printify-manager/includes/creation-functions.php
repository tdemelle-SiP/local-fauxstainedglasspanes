<?php
// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Generates new product JSON based on the selected template ID.
 */
function sip_generate_new_product_json() {
    // Check nonce for security
    check_ajax_referer( 'sip_printify_manager_nonce', 'security' );

    $template_name = sanitize_text_field( $_POST['template_name'] );

    // Fetch the template JSON from the file
    $template_json = sip_get_template_json_from_file( $template_name );

    if ( ! $template_json ) {
        wp_send_json_error( 'Template not found.' );
    }

    // Initialize new product JSON with the template data
    $new_product_json = $template_json;

    // Send the new product JSON back to the JavaScript
    wp_send_json_success( $new_product_json );
}
add_action( 'wp_ajax_sip_generate_new_product_json', 'sip_generate_new_product_json' );

/**
 * Fetches the template JSON from the template file.
 *
 * @param string $template_name
 * @return array|false
 */
function sip_get_template_json_from_file( $template_name ) {
    $template_dir = sip_get_template_dir();
    $file_path = $template_dir . $template_name . '.json';

    if ( ! file_exists( $file_path ) ) {
        return false;
    }

    $template_content = file_get_contents( $file_path );
    return json_decode( $template_content, true );
}

/**
 * Updates the new product data based on user input.
 */
function sip_update_new_product_data() {
    // Check nonce for security
    check_ajax_referer( 'sip_printify_manager_nonce', 'security' );

    // Get the updated data from the AJAX request
    $updated_data = $_POST['updated_data'];
    $key = sanitize_text_field( $updated_data['key'] );
    $value = sanitize_text_field( $updated_data['value'] );
    $template_name = sanitize_text_field( $updated_data['template_name'] );

    $user_id = get_current_user_id();
    $transient_key = 'sip_new_product_data_' . $user_id . '_' . $template_name;

    // Retrieve the current product data
    $product_data = get_transient( $transient_key );

    if ( ! $product_data ) {
        // If no transient exists, fetch the original template data
        $product_data = sip_get_template_json_from_file( $template_name );
        if ( ! $product_data ) {
            wp_send_json_error( 'Template not found.' );
        }
    }

    // Update the product data based on the key
    if ( $key === 'title' ) {
        $product_data['title'] = $value;
    } elseif ( $key === 'description' ) {
        $product_data['description'] = $value;
    } elseif ( $key === 'tags' ) {
        // Assuming tags are a comma-separated string
        $product_data['tags'] = array_map( 'trim', explode( ',', $value ) );
    }

    // Save the updated product data back to the transient
    set_transient( $transient_key, $product_data, 60 * 60 ); // Store for 1 hour

    wp_send_json_success( 'Product data updated successfully.' );
}
add_action( 'wp_ajax_sip_update_new_product_data', 'sip_update_new_product_data' );

function sip_create_product() {
    // Check nonce for security
    check_ajax_referer( 'sip_printify_manager_nonce', 'security' );

    $template_name = sanitize_text_field( $_POST['template_name'] );
    $user_id = get_current_user_id();
    $transient_key = 'sip_new_product_data_' . $user_id . '_' . $template_name;

    // Retrieve the updated product data
    $product_data = get_transient( $transient_key );

    if ( ! $product_data ) {
        wp_send_json_error( 'No product data found.' );
    }

    // Here, you would send the $product_data to Printify via their API
    // For example:
    $api_response = sip_send_product_to_printify( $product_data );

    if ( $api_response['success'] ) {
        // Clear the transient since we're done
        delete_transient( $transient_key );
        wp_send_json_success( 'Product created successfully.' );
    } else {
        wp_send_json_error( 'Error creating product: ' . $api_response['message'] );
    }
}
add_action( 'wp_ajax_sip_create_product', 'sip_create_product' );

/**
 * Send the product data to Printify via API.
 *
 * @param array $product_data
 * @return array
 */
function sip_send_product_to_printify( $product_data ) {
    // Implement the API call to Printify here
    // This is a placeholder function

    // Example response
    return array(
        'success' => true,
        'message' => 'Product created successfully on Printify.'
    );
}
