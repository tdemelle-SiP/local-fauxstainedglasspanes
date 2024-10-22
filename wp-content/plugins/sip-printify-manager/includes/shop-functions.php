<?php


function sip_handle_shop_action() {
    $shop_action = isset($_POST['shop_action']) ? sanitize_text_field($_POST['shop_action']) : '';

    error_log('SiP Printify Manager: Handling shop action: ' . $shop_action);

    switch ($shop_action) {
        case 'new_shop':
            sip_new_shop();
            break;
        case 'clear_shop':
            sip_clear_shop();
            break;
        default:
            wp_send_json_error('Invalid shop action.');
            break;
    }
}

/**
 * Save the Printify API token and store shop details.
 */
function sip_new_shop() {
    $token = sanitize_text_field($_POST['printify_bearer_token']);
    $shop_details = fetch_shop_details($token);
    if ($shop_details) {
        $encrypted_token = sip_encrypt_token($token);
        update_option('printify_bearer_token', $encrypted_token);
        update_option('sip_printify_shop_name', $shop_details['shop_name']);
        update_option('sip_printify_shop_id', $shop_details['shop_id']);

        // Fetch and store images
        $remote_images = fetch_images($token);
        if ($remote_images !== null) {
            $existing_images = get_option('sip_printify_images', array());
            $local_images = array_filter($existing_images, function($image) {
                return isset($image['location']) && $image['location'] === 'Local File';
            });
            $images = array_merge($local_images, $remote_images);
            update_option('sip_printify_images', $images);
        }

        // Fetch and store products
        $encrypted_token = get_option('printify_bearer_token');
        $shop_id = get_option('sip_printify_shop_id');
        $products = fetch_products($encrypted_token, $shop_id);
        if ($products) {
            update_option('sip_printify_products', $products);
        }

        // Include shop_action in the response
        // "shop_action" must be specified to correctly trigger the success function on the front end in the .js file

        wp_send_json_success(array(
            'message' => 'Token saved and connection successful.',
            'shop_action' => 'new_shop'  // Add the shop_action field here
        ));
    } else {
        wp_send_json_error('Invalid API token. Please check and try again.');
    }
}

/**
 * Reset the API token and associated shop details.
 * Only remote images are removed; local images remain in the database.
 */
function sip_clear_shop() {
    error_log('SiP Printify Manager: Clearing shop data');
    delete_option('sip_loaded_template');
    delete_option('printify_bearer_token');
    delete_option('sip_printify_shop_name');
    delete_option('sip_printify_shop_id');
    delete_option('sip_printify_products');
    error_log('SiP Printify Manager: Shop data cleared, token deleted');

    // Retrieve existing images
    $images = get_option('sip_printify_images', array());

    // Clear remote images but keep local ones
    $existing_images = get_option('sip_printify_images', array());
    $local_images = array_filter($existing_images, function($image) {
        return isset($image['location']) && $image['location'] === 'Local File';
    });
    update_option('sip_printify_images', $local_images);

    // Unload the template from the Create New Products table
    delete_option('sip_loaded_template');

    // Delete product JSON files associated with the shop
    clear_product_jsons();

    // Include shop_action in the response
    // "shop_action" must be specified to correctly trigger the success function on the front end in the .js file
    wp_send_json_success(array(
        'message' => 'Shop Cleared successfully.',
        'shop_action' => 'clear_shop'
    ));
}

/**
 * Fetch shop details directly from Printify API using the Bearer token.
 *
 * @param string $token The Bearer token for authenticating API requests.
 * @return array|null Array with shop ID and shop name, or null if error occurs.
 */
 function fetch_shop_details($token) {
    $url = 'https://api.printify.com/v1/shops.json';

    $response = wp_remote_get($url, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token,
        ),
    ));

    if (is_wp_error($response)) {
        return null;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (empty($data) || !isset($data[0]['id']) || !isset($data[0]['title'])) {
        return null;
    }

    return array(
        'shop_id'   => $data[0]['id'],
        'shop_name' => $data[0]['title']
    );
}

/**
 * Save shop details retrieved from Printify API into WordPress options.
 */
function sip_connect_shop() {
    $token = get_option('printify_bearer_token');
    $shop_details = fetch_shop_details($token);
    if ($shop_details) {
        update_option('sip_printify_shop_name', $shop_details['shop_name']);
        update_option('sip_printify_shop_id', $shop_details['shop_id']);
    }
}

/**
 * Clear product JSON files associated with the shop.
 */
function clear_product_jsons() {
    $upload_dir = wp_upload_dir();
    $target_dir = $upload_dir['basedir'] . '/sip-printify-manager/products/';

    // Log the target directory being checked
    error_log("Checking target directory for product JSON files: $target_dir");

    // Check if the directory exists
    if (is_dir($target_dir)) {
        $files = glob($target_dir . '*.json'); // Get all JSON files in the directory

        // Log the number of files found
        error_log("Found " . count($files) . " product JSON files to delete.");

        foreach ($files as $file) {
            if (unlink($file)) { // Delete each file
                error_log("Successfully deleted product JSON file: $file");
            } else {
                error_log("Failed to delete product JSON file: $file");
            }
        }

        // Log completion of deletion process
        error_log("Completed deletion process for product JSON files in directory: $target_dir");
    } else {
        error_log("Target directory does not exist: $target_dir");
    }
}

/**
 * Generate and store the encryption key if it doesn't already exist.
 *
 * This key is used to encrypt and decrypt sensitive information such as the bearer token.
 * It is automatically generated and stored securely in the WordPress options table.
 *
 * @return string The encryption key.
 */
function sip_generate_encryption_key() {
    // Check if the encryption key already exists
    $encryption_key = get_option('sip_printify_encryption_key');

    if (empty($encryption_key)) {
        // Generate a secure encryption key (32 bytes for AES-256)
        $encryption_key = base64_encode(random_bytes(32));
        update_option('sip_printify_encryption_key', $encryption_key);
    }

    return $encryption_key;
}



/**
 * Encrypt the bearer token before storing it.
 *
 * @param string $token The plain text bearer token.
 * @return string The encrypted token.
 */
function sip_encrypt_token($token) {
    // Get the encryption key from the options or generate one if it doesn't exist
    error_log('SiP Printify Manager: Encrypting token');
    $encryption_key = sip_generate_encryption_key();
    error_log('SiP Printify Manager: Encryption key length: ' . strlen($encryption_key));


    // Initialization Vector (IV) for AES encryption (16 bytes)
    $iv = substr(hash('sha256', '16_char_iv_here'), 0, 16);
    $encrypted = openssl_encrypt($token, 'AES-256-CBC', base64_decode($encryption_key), 0, $iv);
    
    if ($encrypted === false) {
        error_log('SiP Printify Manager: Encryption failed. OpenSSL error: ' . openssl_error_string());
        return false;
    }
    
    error_log('SiP Printify Manager: Token encrypted successfully. Length: ' . strlen($encrypted));
    return $encrypted;
}

/**
 * Decrypt the bearer token when retrieving it.
 *
 * @param string $encrypted_token The encrypted token.
 * @return string The plain text bearer token.
 */
function sip_decrypt_token($encrypted_token) {
    // Retrieve the encryption key
    $encryption_key = get_option('sip_printify_encryption_key');

    // Initialization Vector (IV) for AES decryption
    $iv = substr(hash('sha256', '16_char_iv_here'), 0, 16);
    return openssl_decrypt($encrypted_token, 'AES-256-CBC', base64_decode($encryption_key), 0, $iv);
}


