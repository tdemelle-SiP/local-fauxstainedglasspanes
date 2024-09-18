<?php

// Fetch products directly from Printify API using the Bearer token
function fetch_products($encrypted_token, $shop_id) {
    // Decrypt the token before using it
    $token = sip_decrypt_token($encrypted_token);
    
    $url = "https://api.printify.com/v1/shops/{$shop_id}/products.json";

    $response = wp_remote_get($url, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token,
        ),
    ));

    if (is_wp_error($response)) {
        error_log('fetch_products encountered an error: ' . $response->get_error_message());
        return null;
    }

    $body = wp_remote_retrieve_body($response);
    $products = json_decode($body, true);

    if (empty($products) || !isset($products['data'])) {
        error_log('fetch_products received empty or invalid data');
        return null;
    }

    error_log('fetch_products retrieved ' . count($products['data']) . ' products');
    return $products['data']; // Return only the 'data' field that contains the products
}


// Display product list in the WordPress admin
function sip_display_product_list($products) {
    if (empty($products)) {
        error_log('sip_display_product_list found no products');
        echo '<p>No products found.</p>';
        return;
    }

    echo '<div style="max-height: 400px; overflow-y: scroll; border: 1px solid #ccc; padding: 10px;">';
    echo '<ul style="list-style-type: none; padding-left: 0;">';
    
    foreach ($products as $product) {
        $product_url = isset($product['external']['handle']) ? esc_url($product['external']['handle']) : '#';
        echo '<li style="margin-bottom: 10px; display: flex; align-items: center;">';
        echo '<input type="checkbox" name="selected_products[]" value="' . esc_attr($product['id']) . '" style="margin-right: 10px;" />';
        echo '<a href="' . $product_url . '" target="_blank"><strong>' . esc_html($product['title']) . '</strong></a>';
        echo '</li>';
    }

    echo '</ul>';
    echo '</div>';

    error_log('sip_display_product_list completed displaying products');
}

// Handle product actions triggered via AJAX
function sip_handle_product_action() {
    $product_action = sanitize_text_field($_POST['product_action']);
    $selected_products = isset($_POST['selected_products']) ? $_POST['selected_products'] : array();

    // Get the encrypted token and decrypt it
    $encrypted_token = get_option('printify_bearer_token');
    $token = sip_decrypt_token($encrypted_token);
    $shop_id = get_option('sip_printify_shop_id');

    // Fetch and display products
    $updated_products = sip_execute_product_action($product_action, $selected_products);

    ob_start();
    sip_display_product_list($updated_products);
    $product_list_html = ob_get_clean();

    ob_start();
    $templates = sip_load_templates();
    sip_display_template_list($templates);
    $template_list_html = ob_get_clean();

    wp_send_json_success(array('product_list_html' => $product_list_html, 'template_list_html' => $template_list_html));
}

// Execute product actions based on the user's selection
function sip_execute_product_action($action, $selected_products = array()) {
    error_log("sip_execute_product_action called with action: $action");

    $encrypted_token = get_option('printify_bearer_token');
    $token = sip_decrypt_token($encrypted_token);
    $shop_id = get_option('sip_printify_shop_id');

    // Log token and shop ID
    error_log('Using API Token: ' . substr($token, 0, 5) . '***');
    error_log('Using Shop ID: ' . $shop_id);

    if ($action === 'reload') {
        error_log('Reloading products from Printify API.');

        $fetched_products = fetch_products($encrypted_token, $shop_id);

        if ($fetched_products) {
            update_option('sip_printify_products', $fetched_products);
            error_log('Products reloaded and updated in options.');
            return $fetched_products;
        } else {
            error_log('Failed to fetch products during reload action.');
            return array(); // return empty array to avoid errors
        }
    }

    $products = get_option('sip_printify_products');

    if ($action === 'remove_from_manager') {
        if (empty($selected_products)) {
            error_log('No products selected for action: remove_from_manager');
            return $products;
        }

        error_log('Removing selected products from manager.');

        $initial_count = count($products);
        $products = array_filter($products, function ($product) use ($selected_products) {
            return !in_array($product['id'], $selected_products);
        });
        $filtered_count = count($products);

        error_log("Products before removal: $initial_count, after removal: $filtered_count");

        update_option('sip_printify_products', $products);
        error_log('Updated sip_printify_products option after removal.');

    } elseif ($action === 'create_template') {
        error_log('Creating templates for selected products.');

        foreach ($selected_products as $product_id) {
            $product_data = array_filter($products, function ($product) use ($product_id) {
                return $product['id'] === $product_id;
            });

            if (!empty($product_data)) {
                $product = array_shift($product_data);
                sip_save_template($product, $product['title']);
                error_log('Template created for product ID: ' . $product_id);
            } else {
                error_log('Product ID not found in products data: ' . $product_id);
            }
        }
    } else {
        error_log('Unknown action requested: ' . $action);
    }

    return $products;
}

// Simulate processing a product with a Python script (placeholder function)
function process_product_with_python($product_data) {
    error_log('process_product_with_python function called');
    // Simulate running the Python script and getting the processed JSON back
    // Replace with actual script execution as needed
    $json_input = json_encode($product_data);
    // Example: $processed_json = shell_exec("python3 /path/to/your/script.py --json '{$json_input}'");
    $processed_json = $json_input; // Simulating the processed output
    return $processed_json;
}
