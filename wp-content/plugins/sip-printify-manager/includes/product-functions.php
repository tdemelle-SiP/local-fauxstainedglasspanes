<?php
/**
 * Product-related Functions for SiP Printify Manager
 *
 * This file contains functions that handle product-related actions such as displaying the product list.
 */

// Prevent direct access to this file for security reasons
if (!defined('ABSPATH')) exit;

// Handle product actions triggered via AJAX
function sip_handle_product_action() {
    // if (!check_ajax_referer('sip_printify_manager_nonce', 'nonce', false)) {
    //     wp_send_json_error('Security check failed');
    // }

    // Retrieve the action requested by the user from the AJAX POST data
    $product_action = isset($_POST['product_action']) ? sanitize_text_field($_POST['product_action']) : '';
    // Get the list of selected product IDs from the AJAX POST data
    $selected_products = isset($_POST['selected_products']) ? $_POST['selected_products'] : array();

    // Get the encrypted token and decrypt it
    $encrypted_token = get_option('printify_bearer_token');
    $token = sip_decrypt_token($encrypted_token);
    $shop_id = get_option('sip_printify_shop_id');

    // Fetch and display products
    $result = sip_execute_product_action($product_action, $selected_products);

    // Generate the product list HTML
    $product_list_html = sip_display_product_list($result['products']);

    // Load templates
    $templates = sip_load_templates();
    
    // Generate the template list HTML
    $template_list_html = sip_display_template_list($templates);

    // Send a JSON response back to the AJAX call with the updated HTML content
    wp_send_json_success(array(
        'product_list_html' => $product_list_html, 
        'template_list_html' => $template_list_html,
        'message' => $result['message']
    ));
}

// Execute product actions based on the user's selection
function sip_execute_product_action($action, $selected_products = array()) {
    error_log("sip_execute_product_action called with action: $action");

    $encrypted_token = get_option('printify_bearer_token');
    $token = sip_decrypt_token($encrypted_token);
    $shop_id = get_option('sip_printify_shop_id');

    error_log('Using API Token: ' . substr($token, 0, 5) . '***');
    error_log('Using Shop ID: ' . $shop_id);

    $products = get_option('sip_printify_products', array());

    switch ($action) {
        case 'reload':
            error_log('Reloading products from Printify API.');
            $fetched_products = fetch_products($encrypted_token, $shop_id);
            if ($fetched_products) {
                update_option('sip_printify_products', $fetched_products);
                error_log('Products reloaded and updated in options.');
                return array(
                    'products' => $fetched_products,
                    'message' => 'Shop products reloaded successfully.'
                );
            } else {
                error_log('Failed to fetch products during reload action.');
                return array(
                    'products' => $products,
                    'message' => 'Failed to reload shop products.'
                );
            }

        case 'remove_from_manager':
            if (empty($selected_products)) {
                error_log('No products selected for action: remove_from_manager');
                return array('products' => $products, 'message' => 'No products selected for removal.');
            }

            error_log('Removing selected products from manager.');
            $initial_count = count($products);

            $products = array_filter($products, function ($product) use ($selected_products) {
                $product_removed = !in_array($product['id'], $selected_products);
                if (!$product_removed) {
                    delete_product_json($product);
                }
                return $product_removed;
            });
            $filtered_count = count($products);

            error_log("Products before removal: $initial_count, after removal: $filtered_count");
            update_option('sip_printify_products', $products);
            error_log('Updated sip_printify_products option after removal.');

            return array('products' => $products, 'message' => 'Selected products removed successfully.');

        case 'create_template':
            error_log('Creating templates for selected products.');
            foreach ($selected_products as $product_id) {
                $product_data = array_filter($products, function ($product) use ($product_id) {
                    return $product['id'] === $product_id;
                });

                if (!empty($product_data)) {
                    $product = array_shift($product_data);
                    $transformed_product = transform_product_data($product);
                    $template_title = $transformed_product['title'];
                    sip_save_template($transformed_product, $template_title);
                    error_log('Template created for product ID: ' . $product_id);
                } else {
                    error_log('Product ID not found in products data: ' . $product_id);
                }
            }
            return array('products' => $products, 'message' => 'Templates created successfully.');

        default:
            error_log('Unknown action requested: ' . $action);
            return array('products' => $products, 'message' => 'Unknown action requested.');
    }
}


// Fetch products directly from Printify API using the Bearer token
function fetch_products($encrypted_token, $shop_id) {
    // Decrypt the token before using it
    $token = sip_decrypt_token($encrypted_token);
    
    error_log('shop_id: ' . $shop_id);   
    
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

    // Ensure that $products is an array
    if (!is_array($products)) {
        error_log('fetch_products: $products is not an array');
        return null;
    }

    if (empty($products) || !isset($products['data'])) {
        error_log('fetch_products received empty or invalid data');
        return null;
    }

    error_log('fetch_products retrieved ' . count($products['data']) . ' products');

    // Save each product as a separate JSON file
    save_products_to_json($products['data']);

    return $products['data']; // Return only the 'data' field that contains the products
}

/**
 * Save each product to a separate JSON file
 *
 * @param array $products Array of products to save.
 */
function save_products_to_json($products) {
    $upload_dir = wp_upload_dir(); // Get the uploads directory
    $target_dir = $upload_dir['basedir'] . '/sip-printify-manager/products/'; // Define the target directory

    // Create the directory if it doesn't exist
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    foreach ($products as $product) {
        // Ensure the product array contains a title
        if (isset($product['title'])) {
            // Format the filename using the product title
            $formatted_title = strtolower(str_replace(' ', '-', trim($product['title'])));
            // Define the filename based on the formatted title
            $filename = $target_dir . $formatted_title . '.json';
            
            // Check if the file already exists and prevent overwriting
            if (!file_exists($filename)) {
                // Save product data as JSON
                file_put_contents($filename, json_encode($product, JSON_PRETTY_PRINT));
                error_log("Saved product data to $filename");
            } else {
                error_log("File $filename already exists. Skipping.");
            }
        } else {
            error_log('Product does not have a title. Skipping saving.');
        }
    }
}

/**
 * Display the Product List in the Admin Interface
 *
 * @param array $products The array of products to display.
 */
function sip_display_product_list($products) {
    if (empty($products)) {
        return '<div id="no-products-found" style="padding: 10px;">
            <p>' . esc_html__('No products found.', 'sip-printify-manager') . '</p>
            <button type="button" id="reload-products-button" class="button button-primary">' . esc_html__('Reload Shop Products', 'sip-printify-manager') . '</button>
        </div>';
    }
    
    $html = '<div id="product-table-container">';
    $html .= '<table id="product-table-header">';
    $html .= '<colgroup>
        <col style="width: 8%;">
        <col style="width: 20%;">
        <col style="width: 72%;">
    </colgroup>';
    $html .= '<thead>
        <tr>
            <th><input type="checkbox" id="select-all-products"></th>
            <th>Thumb</th>
            <th>Product Name</th>
        </tr>
    </thead>';
    $html .= '</table>';

    $html .= '<div id="product-table-body">';
    $html .= '<table id="product-table-content">';
    $html .= '<colgroup>
        <col style="width: 8%;">
        <col style="width: 20%;">
        <col style="width: 72%;">
    </colgroup>';
    
    $html .= '<tbody>';
    foreach ($products as $product) {
        $thumbnail_src = !empty($product['images']) ? $product['images'][0]['src'] : '';
        $html .= '<tr>
            <td><input type="checkbox" name="selected_products[]" value="' . esc_attr($product['id']) . '" /></td>
            <td>
                <a href="' . esc_url($thumbnail_src) . '" target="_blank">
                    <img src="' . esc_url($thumbnail_src) . '" alt="' . esc_attr($product['title']) . '">
                </a>
            </td>
            <td>' . esc_html($product['title']) . '</td>
        </tr>';
    }
    $html .= '</tbody>';

    $html .= '</table>';
    $html .= '</div>';
    $html .= '</div>';

    return $html;
}


/**
 * Delete the JSON file associated with a product
 *
 * @param array $product The product whose JSON file is to be deleted.
 */
function delete_product_json($product) {
    $upload_dir = wp_upload_dir();
    $target_dir = $upload_dir['basedir'] . '/sip-printify-manager/products/';
    
    if (isset($product['title'])) {
        $formatted_title = strtolower(str_replace(' ', '-', trim($product['title'])));
        $filename = $target_dir . $formatted_title . '.json';

        // Delete the JSON file if it exists
        if (file_exists($filename)) {
            unlink($filename);
            error_log("Deleted product JSON file: $filename");
        } else {
            error_log("JSON file not found for product: $filename");
        }
    }
}

// Transform the product data according to specified rules
function transform_product_data($product) {
    // Add 'source product' key with the value being the title of the product
    if (isset($product['title'])) {
        $product['source product'] = $product['title'];
    }

    if (isset($product['id'])) {
        $product['source product id'] = $product['id'];
    }

    // Process the 'options' array to create mappings for colors and sizes
    $colors_map = array();
    $sizes_map = array();

    // Iterate over the 'options' array to build the color and size maps
    if (isset($product['options']) && is_array($product['options'])) {
        foreach ($product['options'] as $option) {
            if (isset($option['name'], $option['values'])) {
                // Process colors
                if (($option['name'] == 'Colors' || $option['name'] == 'Color') && isset($option['values'])) {
                    foreach ($option['values'] as $value) {
                        foreach ($option['values'] as $value) {
                            $id = $value['id'];
                            $colors_map[$id] = array(
                                'id' => $value['id'],
                                'title' => $value['title'],
                                'colors' => isset($value['colors']) ? $value['colors'] : null
                            );
                        }
                    }
                } elseif (($option['name'] == 'Sizes' || $option['name'] == 'Size') && isset($option['values'])) {
                    foreach ($option['values'] as $value) {
                        $id = $value['id'];
                        $sizes_map[$id] = array(
                            'id' => $value['id'],
                            'title' => $value['title']
                        );
                    }
                }
            }
        }
    }
        

    // Initialize arrays to hold enabled variants and IDs of removed variants
    $enabled_variants = array();
    $removed_variant_ids = array();

    // Arrays to hold enabled color and size IDs
    $enabled_color_ids = array();
    $enabled_size_ids = array();

    // Process the 'variants' array
    if (isset($product['variants']) && is_array($product['variants'])) {
        foreach ($product['variants'] as $variant) {
            if (isset($variant['is_enabled']) && $variant['is_enabled'] === true) {
                // Collect option IDs from enabled variants
                if (isset($variant['options']) && is_array($variant['options'])) {
                    // Determine which option is size and which is color
                    $size_id = null;
                    $color_id = null;
                    if (isset($sizes_map[$variant['options'][0]])) {
                        $size_id = $variant['options'][0];
                        $color_id = $variant['options'][1];
                    } else {
                        $color_id = $variant['options'][0];
                        $size_id = $variant['options'][1];
                    }

                    if ($size_id !== null) $enabled_size_ids[] = $size_id;
                    if ($color_id !== null) $enabled_color_ids[] = $color_id;
                }

                // If the variant is enabled, keep only specified keys
                $variant_keys_to_keep = array('id', 'price', 'is_enabled', 'options');
                $new_variant = array();
                foreach ($variant_keys_to_keep as $key) {
                    if (isset($variant[$key])) {
                        $new_variant[$key] = $variant[$key];
                    }
                }
                // Add the new variant to the enabled variants array
                $enabled_variants[] = $new_variant;
            } else {
                // If the variant is not enabled, collect its ID for later removal
                if (isset($variant['id'])) {
                    $removed_variant_ids[] = $variant['id'];
                }
            }
        }
        // Replace the 'variants' array with the array of enabled variants
        $product['variants'] = $enabled_variants;
    }

    // Make enabled color and size IDs unique
    $enabled_color_ids = array_unique($enabled_color_ids);
    $enabled_size_ids = array_unique($enabled_size_ids);

    // Build 'options - colors' array
    $options_colors = array();
    foreach ($enabled_color_ids as $color_id) {
        if (isset($colors_map[$color_id])) {
            $options_colors[] = $colors_map[$color_id];
        }
    }

    // Build 'options - sizes' array
    $options_sizes = array();
    foreach ($enabled_size_ids as $size_id) {
        if (isset($sizes_map[$size_id])) {
            $options_sizes[] = $sizes_map[$size_id];
        }
    }

    // Add the options arrays to the product data at the end
    $product['options - colors'] = $options_colors;
    $product['options - sizes'] = $options_sizes;

    // Remove specified top-level keys from the product data
    $keys_to_remove = array(
        'id',
        'options', // Removed 'options' only from the top level
        'images',
        'created_at',
        'updated_at',
        'visible',
        'is_locked',
        'external',
        'user_id',
        'shop_id',
        'print_details',
        'sales_channel_properties',
        'is_printify_express_eligible',
        'is_printify_express_enabled',
        'is_economy_shipping_eligible',
        'is_economy_shipping_enabled',
        'views',
        'font_color',
        'font_family'
    );

    // Remove the specified top-level keys from the product data
    foreach ($keys_to_remove as $key) {
        if (isset($product[$key])) {
            unset($product[$key]);
        }
    }

    // Process the 'print_areas' array
    if (isset($product['placeholders']) && is_array($product['placeholders'])) {
        $new_print_areas = array();
        foreach ($product['placeholders'] as $print_area) {
            // Ensure 'position' exists in each print area
            if (!isset($print_area['position']) || empty($print_area['position'])) {
                // Log the missing 'position' for debugging purposes
                error_log('Missing position in print_area: ' . json_encode($print_area));
                // Skip this print area as 'position' is essential
                continue;
            }

            // Remove 'variant_ids' that have been removed from 'variants'
            if (isset($print_area['variant_ids']) && is_array($print_area['variant_ids'])) {
                // Remove the variant IDs that were removed from 'variants'
                $variant_ids = array_diff($print_area['variant_ids'], $removed_variant_ids);
                if (empty($variant_ids)) {
                    // If no variant IDs are left, skip this print area
                    continue;
                }
                // Update the 'variant_ids' with the remaining IDs
                $print_area['variant_ids'] = array_values($variant_ids); // Re-index array
            }

            // Process the 'placeholders' array within the print area
            if (isset($print_area['placeholders']) && is_array($print_area['placeholders'])) {
                $new_placeholders = array();
                foreach ($print_area['placeholders'] as $placeholder) {
                    // Check if the 'images' array is not empty
                    if (isset($placeholder['images']) && is_array($placeholder['images']) && !empty($placeholder['images'])) {
                        // Add the placeholder to the new placeholders array
                        $new_placeholders[] = $placeholder;
                    }
                    // If 'images' is empty, skip this placeholder
                }
                if (!empty($new_placeholders)) {
                    // Update the 'placeholders' with the new placeholders
                    $print_area['placeholders'] = $new_placeholders;
                } else {
                    // Remove the 'placeholders' key if it's empty
                    unset($print_area['placeholders']);
                }
            }

            // Add the processed print area to the new print areas array
            $new_print_areas[] = $print_area;
        }
        // Replace the 'print_areas' array with the new print areas
        $product['print_areas'] = $new_print_areas;
    }

    // Remove keys that have empty arrays, even if they were specified for removal
    $keys_with_empty_arrays = array('external', 'print_details', 'sales_channel_properties');
    foreach ($keys_with_empty_arrays as $key) {
        if (isset($product[$key]) && empty($product[$key])) {
            unset($product[$key]);
        }
    }

    // Return the transformed product data
    return $product;
}

