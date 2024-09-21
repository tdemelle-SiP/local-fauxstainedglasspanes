<?php
/**
 * Image-related Functions for SiP Printify Manager
 *
 * This file contains functions that handle image-related actions such as fetching images from the Printify API,
 * executing image actions (e.g., reload, upload, archive), displaying the image list, and handling image uploads.
 */

// Prevent direct access for security
if (!defined('ABSPATH')) exit;

/**
 * Handle Image Actions Triggered via AJAX
 *
 * This function processes image-related actions sent via AJAX from the admin interface.
 * It delegates the action to the appropriate function based on the action type.
 */
function sip_handle_image_action() {
    error_log('sip_handle_image_action() called');
    $image_action = sanitize_text_field($_POST['image_action']);
    $selected_images = isset($_POST['selected_images']) ? $_POST['selected_images'] : array();

    $result = sip_execute_image_action($image_action, $selected_images);
    $images = $result['images'];
    $message = isset($result['message']) ? $result['message'] : '';

    // Generate the updated image list HTML
    ob_start();
    sip_display_image_list($images);
    $image_list_html = ob_get_clean();

    // Send the response back to the AJAX call
    wp_send_json_success(array('image_list_html' => $image_list_html, 'message' => $message));
}

/**
 * Execute Image Actions Based on User Selection
 *
 * This function performs the specified action on the selected images.
 * Supported actions include reloading images from the Printify API, uploading images to the shop,
 * removing images from the manager, and archiving images on the Printify shop.
 *
 * @param string $action The action to perform.
 * @param array $selected_images The IDs of the selected images.
 * @return array An array containing the updated images and any messages.
 */
function sip_execute_image_action($action, $selected_images = array()) {
    $encrypted_token = get_option('printify_bearer_token');
    $token = sip_decrypt_token($encrypted_token);

    // Retrieve current images
    $images = get_option('sip_printify_images', array());

    if ($action === 'reload_shop_images') {
        // Fetch images from Printify API
        $remote_images = fetch_images($token);

        if ($remote_images !== null) {
            // Get existing images from options
            $existing_images = get_option('sip_printify_images', array());

            // Separate local images from existing images
            $local_images = array_filter($existing_images, function($image) {
                return isset($image['location']) && $image['location'] === 'Local File';
            });

            // Merge local images with newly fetched remote images
            $images = array_merge($local_images, $remote_images);

            // Update the images option with the merged array
            update_option('sip_printify_images', $images);

            return array('images' => $images, 'message' => 'Shop images reloaded successfully.');
        } else {
            return array('images' => $images, 'message' => 'Failed to reload shop images.');
        }
    }

    if ($action === 'remove_from_manager') {
        // Remove selected images from the manager (local database)
        $images = array_filter($images, function($image) use ($selected_images) {
            return !in_array($image['id'], $selected_images);
        });
        update_option('sip_printify_images', $images);
        return array('images' => $images, 'message' => 'Selected images removed from manager.');
    }

    if ($action === 'upload_to_shop') {
        $uploaded_images = array();
        $already_in_shop = array();
        $errors = array();
    
        foreach ($selected_images as $image_id) {
            // Find the image in the images array
            foreach ($images as &$image) {
                if ($image['id'] === $image_id) {
                    if ($image['location'] === 'Local File') {
                        // Upload image to shop
                        $upload_result = upload_image_to_shop($token, $image);
                        if ($upload_result['success']) {
                            // Update image data with new info from shop
                            $image = array_merge($image, $upload_result['image_data']);
                            $image['location'] = 'Printify Shop'; // Update location
                            $uploaded_images[] = $image['file_name'];
                        } else {
                            $errors[] = $upload_result['message'];
                        }
                    } else {
                        $already_in_shop[] = $image['file_name'];
                    }
                    break;
                }
            }
        }
    
        // Update images option with the modified images array
        update_option('sip_printify_images', $images);
    
        // Prepare the response message
        $message = '';
        if (!empty($uploaded_images)) {
            $message .= 'Uploaded images: ' . implode(', ', $uploaded_images) . '. ';
        }
        if (!empty($already_in_shop)) {
            $message .= 'Files already in the shop: ' . implode(', ', $already_in_shop) . '. ';
        }
        if (!empty($errors)) {
            $message .= 'Errors: ' . implode(' ', $errors);
        }
    
        return array('images' => $images, 'message' => $message);
    }

    if ($action === 'archive_shop_image') {
        $archived_images = array();
        $errors = array();

        foreach ($selected_images as $image_id) {
            // Find the image in the images array
            foreach ($images as &$image) {
                if ($image['id'] === $image_id) {
                    if ($image['location'] === 'Printify Shop') {
                        // Archive image on Printify
                        $archive_result = archive_image_on_shop($token, $image['id']);
                        if ($archive_result['success']) {
                            $image['location'] = 'Printify Shop (Archived)';
                            $archived_images[] = $image['file_name'];
                        } else {
                            $errors[] = $archive_result['message'];
                        }
                    } else {
                        $errors[] = "Image '{$image['file_name']}' is not in the shop.";
                    }
                    break;
                }
            }
        }

        // Update images option
        update_option('sip_printify_images', $images);

        // Prepare message
        $message = '';
        if (!empty($archived_images)) {
            $message .= 'Archived images: ' . implode(', ', $archived_images) . '. ';
        }
        if (!empty($errors)) {
            $message .= 'Errors: ' . implode(' ', $errors);
        }

        return array('images' => $images, 'message' => $message);
    }

    // Handle other actions as needed...

    return array('images' => $images, 'message' => 'No action performed.');
}

/**
 * Fetch Images from the Printify API with Pagination
 *
 * This function fetches all images from the Printify API by making sequential API calls
 * and handling pagination. It continues fetching images until no more images are returned.
 *
 * @param string $token The decrypted API token.
 * @return array|null An array of images or null on failure.
 */
// includes/image-functions.php

function fetch_images($token) {
    $all_images = array();
    $page = 1;
    $per_page = 100; // Maximum allowed per Printify API documentation

    do {
        $url = "https://api.printify.com/v1/uploads.json?page={$page}&limit={$per_page}";

        $response = wp_remote_get($url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $token,
            ),
        ));

        if (is_wp_error($response)) {
            error_log('fetch_images encountered an error: ' . $response->get_error_message());
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $images = json_decode($body, true);

        if (empty($images) || !isset($images['data'])) {
            error_log('fetch_images received empty or invalid data');
            return null;
        }

        // Add 'location' => 'Remote' or 'Remote (Archived)' to each image
        foreach ($images['data'] as &$image) {
            // Determine location based on Printify API response
            if (isset($image['is_archived']) && $image['is_archived']) {
                $image['location'] = 'Printify Shop (Archived)';
            } else {
                $image['location'] = 'Printify Shop'; // Set location for remote images
            }
            // Other processing as needed
        }

        $all_images = array_merge($all_images, $images['data']);

        if (count($images['data']) < $per_page) {
            break; // No more pages
        }

        $page++;
    } while (true);

    error_log('fetch_images retrieved total ' . count($all_images) . ' images');
    return $all_images;
}


/**
 * Display the Image List in the Admin Interface
 *
 * @param array $images The array of images to display.
 */
function sip_display_image_list($images) {
    if (empty($images)) {
        echo '<p>No images found.</p>';
        return;
    }

    echo '<div style="overflow-y: auto;">';
    echo '<table style="width: 100%; border-collapse: collapse; table-layout: fixed;">';

    // Define column widths to prevent horizontal scrollbar
    echo '<colgroup>';
    echo '<col style="width: 4%;">';   // Select checkbox
    echo '<col style="width: 8%;">';  // Thumbnail
    echo '<col style="width: 42%;">';  // Filename
    echo '<col style="width: 15%;">';  // Location
    echo '<col style="width: 15%;">';  // Uploaded
    echo '<col style="width: 10%;">';  // Dimensions
    echo '<col style="width: 10%;">';  // Size
    echo '</colgroup>';

    // Table Header
    echo '<thead>';
    echo '<tr>';
    // Select all checkbox in header
    echo '<th style="position: sticky; top: 0; background-color: #fff; z-index: 2; text-align: center; padding: 2px;"><input type="checkbox" id="select-all-images"></th>';
    echo '<th style="position: sticky; top: 0; background-color: #fff; z-index: 2; text-align: center; padding: 2px;">Thumb</th>';
    echo '<th style="position: sticky; top: 0; background-color: #fff; z-index: 2; text-align: left; padding: 2px;">Filename</th>';
    echo '<th style="position: sticky; top: 0; background-color: #fff; z-index: 2; text-align: center; padding: 2px;">Location</th>';
    echo '<th style="position: sticky; top: 0; background-color: #fff; z-index: 2; text-align: center; padding: 2px;">Uploaded</th>';
    echo '<th style="position: sticky; top: 0; background-color: #fff; z-index: 2; text-align: center; padding: 2px;">Dimensions</th>';
    echo '<th style="position: sticky; top: 0; background-color: #fff; z-index: 2; text-align: center; padding: 2px;">Size</th>';
    echo '</tr>';
    echo '</thead>';


    // Table Body
    echo '<tbody>';  
    foreach ($images as $image) {
        // Ensure 'location' key exists
        $location = isset($image['location']) ? $image['location'] : 'Unknown';
        // Format upload time as "24_09_02 1:25pm"
        $upload_time = isset($image['upload_time']) ? date('y_m_d g:ia', strtotime($image['upload_time'])) : '';
        $dimensions = isset($image['width']) && isset($image['height']) ? esc_html($image['width']) . 'x' . esc_html($image['height']) : '';
        $size = isset($image['size']) ? esc_html(format_file_size($image['size'])) : '';
    
        // Use full filename without truncation
        $filename = esc_html($image['file_name']);

        echo '<tr title="' . esc_attr($filename) . '">';
        echo '<td style="text-align: center; padding: 2px;"><input type="checkbox" name="selected_images[]" value="' . esc_attr($image['id']) . '" /></td>';
        // Link the thumbnail to the preview image with cursor pointer
        echo '<td style="text-align: center; padding: 2px;">
                <a href="' . esc_url($image['preview_url']) . '" target="_blank">
                    <img src="' . esc_url($image['preview_url']) . '" alt="' . esc_attr($filename) . '" style="width: 32px; height: auto; cursor: pointer;">
                </a>
              </td>';
        echo '<td style="text-align: left; padding: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' . $filename . '</td>';
        echo '<td style="text-align: center; padding: 2px;">' . esc_html($location) . '</td>';
        echo '<td style="text-align: center; padding: 2px;">' . $upload_time . '</td>';
        echo '<td style="text-align: center; padding: 2px;">' . $dimensions . '</td>';
        echo '<td style="text-align: center; padding: 2px;">' . $size . '</td>';
        echo '</tr>';
    }
    echo '</tbody>';
    

    echo '</table>';
    echo '</div>';
}

/**
 * Format File Size into Human-Readable Format
 *
 * @param int $bytes The file size in bytes.
 * @return string The formatted file size.
 */
function format_file_size($bytes) {
    if ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } else {
        return number_format($bytes / 1024, 2) . ' kB';
    }
}


/**
 * Handle Image Uploads via AJAX
 *
 * This function processes image uploads sent via AJAX from the admin interface.
 * It saves the uploaded images to a local directory and updates the images list.
 */
function sip_handle_image_upload() {
    // Check if images are uploaded
    if (empty($_FILES['images'])) {
        wp_send_json_error('No images uploaded.');
    }

    $images = $_FILES['images'];
    $uploaded_images = array();
    $errors = array();

    // Get existing images to check for duplicates
    $existing_images = get_option('sip_printify_images', array());

    // Create an array of existing image filenames
    $existing_filenames = array_map(function($image) {
        return $image['file_name'];
    }, $existing_images);

    // Loop through each uploaded file
    for ($i = 0; $i < count($images['name']); $i++) {
        $file_name = sanitize_file_name($images['name'][$i]);
        $file_tmp = $images['tmp_name'][$i];
        $file_size = $images['size'][$i];
        $file_error = $images['error'][$i];

        if ($file_error === UPLOAD_ERR_OK) {
            // Check if file already exists in the shop
            if (in_array($file_name, $existing_filenames)) {
                $errors[] = "File '{$file_name}' already exists in the shop.";
                continue;
            }

            // Save the file to a local directory
            $upload_dir = wp_upload_dir();
            $sip_upload_dir = $upload_dir['basedir'] . '/sip_printify_manager/';
            $sip_upload_url = $upload_dir['baseurl'] . '/sip_printify_manager/';

            if (!file_exists($sip_upload_dir)) {
                wp_mkdir_p($sip_upload_dir);
            }

            $destination = $sip_upload_dir . $file_name;
            if (move_uploaded_file($file_tmp, $destination)) {
                // Get image dimensions
                list($width, $height) = getimagesize($destination);

                // Prepare image data
                $image_data = array(
                    'id' => uniqid('local_'),
                    'file_name' => $file_name,
                    'size' => $file_size,
                    'width' => $width,
                    'height' => $height,
                    'preview_url' => $sip_upload_url . $file_name,
                    'location' => 'Local File',
                );

                // Add image to existing images
                $existing_images[] = $image_data;
                $uploaded_images[] = $file_name;
            } else {
                $errors[] = "Failed to move file '{$file_name}' to upload directory.";
            }
        } else {
            $errors[] = "Error uploading file '{$file_name}'.";
        }
    }

    // Update the images option
    update_option('sip_printify_images', $existing_images);

    // Prepare the response message
    $message = '';
    if (!empty($uploaded_images)) {
        $message .= 'Uploaded images: ' . implode(', ', $uploaded_images) . '. ';
    }
    if (!empty($errors)) {
        $message .= 'Errors: ' . implode(' ', $errors);
    }

    // Re-display the image list
    ob_start();
    sip_display_image_list($existing_images);
    $image_list_html = ob_get_clean();

    wp_send_json_success(array('message' => $message, 'image_list_html' => $image_list_html));
}

/**
 * Upload an Image to the Printify Shop
 *
 * This function uploads a local image to the Printify shop via the API.
 *
 * @param string $token The decrypted API token.
 * @param array $image The image data array.
 * @return array An array containing success status and image data or error message.
 */
function upload_image_to_shop($token, $image) {
    // Read the image file
    $file_path = str_replace(site_url('/'), ABSPATH, $image['preview_url']);
    $file_contents = file_get_contents($file_path);

    if ($file_contents === false) {
        return array(
            'success' => false,
            'message' => "Failed to read file '{$image['file_name']}'."
        );
    }

    // Prepare the API request to upload the image
    $url = 'https://api.printify.com/v1/uploads/images.json';

    $response = wp_remote_post($url, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode(array(
            'file_name' => $image['file_name'],
            'contents' => base64_encode($file_contents),
        )),
    ));

    if (is_wp_error($response)) {
        return array(
            'success' => false,
            'message' => "Failed to upload '{$image['file_name']}': " . $response->get_error_message()
        );
    }

    $body = wp_remote_retrieve_body($response);
    $uploaded_image = json_decode($body, true);

    if (isset($uploaded_image['error'])) {
        return array(
            'success' => false,
            'message' => "Failed to upload '{$image['file_name']}': " . $uploaded_image['error']['message']
        );
    }

    // Return the new image data
    return array(
        'success' => true,
        'image_data' => $uploaded_image
    );
}

/**
 * Archive an Image on the Printify Shop
 *
 * This function archives an image on the Printify shop via the API.
 *
 * @param string $token The decrypted API token.
 * @param string $image_id The ID of the image to archive.
 * @return array An array containing success status and message.
 */
function archive_image_on_shop($token, $image_id) {
    $url = "https://api.printify.com/v1/uploads/{$image_id}/archive.json";

    $response = wp_remote_post($url, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token,
        ),
    ));

    if (is_wp_error($response)) {
        return array(
            'success' => false,
            'message' => "Failed to archive image ID '{$image_id}': " . $response->get_error_message()
        );
    }

    $response_code = wp_remote_retrieve_response_code($response);

    if ($response_code == 200) {
        return array(
            'success' => true,
            'message' => "Image ID '{$image_id}' archived successfully."
        );
    } else {
        $body = wp_remote_retrieve_body($response);
        $error = json_decode($body, true);
        return array(
            'success' => false,
            'message' => "Failed to archive image ID '{$image_id}': " . (isset($error['error']['message']) ? $error['error']['message'] : 'Unknown error.')
        );
    }
}
