<?php
/**
 * Image-related Functions for SiP Printify Manager
 *
 * This file contains functions that handle image-related actions such as fetching images from the Printify API,
 * executing image actions (e.g., reload, upload, archive), displaying the image list, and handling image uploads.
 */

// Prevent direct access for security
if (!defined('ABSPATH')) exit;

function generate_image_gallery_from_directory() {
    $directory = WP_CONTENT_DIR . '/uploads/sip-printify-manager/images/';
    $directory_url = content_url('uploads/sip-printify-manager/images/');
    
    // Ensure the directory exists
    if (!is_dir($directory)) {
        return '<p>Gallery directory not found.</p>';
    }

    // Read all image files from the directory
    $image_files = glob($directory . '*.{jpg,jpeg,png,gif}', GLOB_BRACE);

    if (empty($image_files)) {
        return '<p>No images found in the gallery directory.</p>';
    }

    // Generate the gallery HTML
    $gallery_html = '<div id="my-gallery">';
    foreach ($image_files as $image_path) {
        $image_url = $directory_url . basename($image_path);
        $gallery_html .= sprintf(
            '<a href="%1$s" data-pswp-width="800" data-pswp-height="600">
                <img src="%1$s" alt="%2$s" width="150" height="150">
            </a>',
            esc_url($image_url),
            esc_attr(basename($image_path))
        );
    }
    $gallery_html .= '</div>';

    return $gallery_html;
}

function sip_printify_manager_gallery_shortcode() {
    return generate_image_gallery_from_directory();
}
add_shortcode('sip_gallery', 'sip_printify_manager_gallery_shortcode');

// add gallery shortcode: [sip_gallery]

/**
 * Handle Image Actions Triggered via AJAX
 *
 * This function processes image-related actions sent via AJAX from the admin interface.
 * It delegates the action to the appropriate function based on the action type.
 */
function sip_handle_image_action() {
    error_log('sip_handle_image_action() called');
    $image_action = isset($_POST['image_action']) ? sanitize_text_field($_POST['image_action']) : '';
    $selected_images = isset($_POST['selected_images']) ? $_POST['selected_images'] : array();

    // Log the received data for debugging
    error_log('Action: ' . $image_action);
    error_log('Selected images: ' . print_r($selected_images, true));

    $result = array();

    switch ($image_action) {
        case 'reload_shop_images':
            $result = sip_execute_image_action($image_action);
            break;
        case 'remove_from_manager':
            $result = sip_remove_images_from_manager($selected_images);
            break;
        case 'upload_to_shop':
        case 'archive_shop_image':
            $result = sip_execute_image_action($image_action, $selected_images);
            break;
        case 'upload_images':
            if (empty($_FILES['images'])) {
                wp_send_json_error('No images uploaded.');
            }
            $result = sip_handle_image_upload();
            break;
        default:
            wp_send_json_error('Invalid image action.');
            return;
    }

    $images = isset($result['images']) ? $result['images'] : array();
    $message = isset($result['message']) ? $result['message'] : '';

    // Generate the updated image list HTML
    $image_list_html = sip_display_image_list($images);

    // Send the response back to the AJAX call
    wp_send_json_success($result);
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

    switch ($action) {
        case 'reload_shop_images':
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

                return array(
                    'images' => $images,
                    'image_list_html' => sip_display_image_list($images),
                    'message' => 'Shop images reloaded successfully.'
                );
            } else {
                return array(
                    'images' => get_option('sip_printify_images', array()),
                    'image_list_html' => sip_display_image_list(get_option('sip_printify_images', array())),
                    'message' => 'Failed to reload shop images.'
                );
            };

        case 'remove_from_manager':
            if (empty($selected_images)) {
                return array(
                    'images' => $images,
                    'message' => 'No images selected for removal.'
                );
            }

            // Remove selected images from the manager (local database)
            $images = array_filter($images, function ($image) use ($selected_images) {
                return !in_array($image['id'], $selected_images);
            });
            update_option('sip_printify_images', $images);
            
            return array(
                'images' => $images, 
                'message' => 'Selected images removed from manager.'
            );

        case 'upload_to_shop':
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
        
            return array(
                'images' => $images,
                'message' => $message
            );

        case 'archive_shop_image':
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

        default:
            return array('images' => $images, 'message' => 'No action performed.');
    }
}

function sip_remove_images_from_manager($selected_images) {
    $images = get_option('sip_printify_images', array());
    $images = array_filter($images, function($image) use ($selected_images) {
        return !in_array($image['id'], $selected_images);
    });
    update_option('sip_printify_images', $images);

    return array(
        'image_list_html' => sip_display_image_list($images),
        'message' => 'Images removed successfully.'
    );
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
function fetch_images($token) {
    $all_images = array();
    $page = 1;
    $per_page = 100;

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

        foreach ($images['data'] as &$image) {
            $image['location'] = isset($image['is_archived']) && $image['is_archived'] ? 'Printify Shop (Archived)' : 'Printify Shop';
            if (!isset($image['upload_time']) && isset($image['created_at'])) {
                $image['upload_time'] = $image['created_at'];
            }
        }

        $all_images = array_merge($all_images, $images['data']);

        if (count($images['data']) < $per_page) {
            break;
        }

        $page++;
    } while (true);

    error_log('fetch_images retrieved total ' . count($all_images) . ' images');
    return $all_images;
}

/**
 * Generate the Image List HTML for the Admin Interface
 *
 * @param array $images The array of images to display.
 * @return string The HTML for the image list.
 */
function sip_display_image_list($images) {
    if (empty($images)) {
        return '<div id="no-images-found" style="padding: 10px;">
            <p>' . esc_html__('No images loaded.', 'sip-printify-manager') . '</p>
            <button type="button" id="reload-images-button" class="button button-primary">' . esc_html__('Reload Shop Images', 'sip-printify-manager') . '</button>
        </div>';
    }

    $html = '<div id="image-table-container">';
    $html .= '<table id="image-table-header">';

    // Define column widths to prevent horizontal scrollbar
    $html .= '<colgroup>
        <col style="width: 3%;">
        <col style="width: 6%;">
        <col style="width: 41%;">
        <col style="width: 12%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 10%;">
        <col style="width: 17px;">
    </colgroup>';

    // Table Header
    $html .= '<thead>
        <tr>
            <th><input type="checkbox" id="select-all-images"></th>
            <th>Thumb</th>
            <th class="sortable" data-sort="file_name">Filename ' . sip_get_sort_icon('outline-down') . '</th>
            <th class="sortable" data-sort="location">Location ' . sip_get_sort_icon('outline-down') . '</th>
            <th class="sortable current-sort desc" data-sort="upload_time">Uploaded ' . sip_get_sort_icon('solid-down') . '</th>
            <th class="sortable" data-sort="dimensions">Dimensions ' . sip_get_sort_icon('outline-down') . '</th>
            <th class="sortable" data-sort="size">Size ' . sip_get_sort_icon('outline-down') . '</th>
        </tr>
    </thead>';
    $html .= '</table>';

    $html .= '<div id="image-table-body">';
    $html .= '<table id="image-table-content">';
    $html .= '<colgroup>
        <col style="width: 3%;">
        <col style="width: 6%;">
        <col style="width: 41%;">
        <col style="width: 12%;">
        <col style="width: 14%;">
        <col style="width: 14%;">
        <col style="width: 10%;">
    </colgroup>';

    // Table Body
    $html .= '<tbody>';
    foreach ($images as $image) {
        $location = isset($image['location']) ? $image['location'] : 'Unknown';
        $upload_time = isset($image['upload_time']) ? date('y_m_d g:ia', strtotime($image['upload_time'])) : '';
        $dimensions = isset($image['width']) && isset($image['height']) ? esc_html($image['width']) . 'x' . esc_html($image['height']) : '';
        $size = isset($image['size']) ? esc_html(format_file_size($image['size'])) : '';
        $filename = esc_html($image['file_name']);
        $full_image_url = esc_url($image['preview_url']);
        $width = esc_attr($image['width']);
        $height = esc_attr($image['height']);

        // Create the table row with PhotoSwipe attributes
        $html .= '<tr title="' . esc_attr($filename) . '">
            <td><input type="checkbox" name="selected_images[]" value="' . esc_attr($image['id']) . '" /></td>
            <td>
                <a href="' . $full_image_url . '" data-pswp-src="' . $full_image_url . '" 
                data-pswp-width="' . $width . '" 
                data-pswp-height="' . $height . '">
                    <img src="' . $full_image_url . '" alt="' . esc_attr($filename) . '" style="max-width: 100px;">
                </a>
            </td>
            <td>' . $filename . '</td>
            <td>' . esc_html($location) . '</td>
            <td>' . $upload_time . '</td>
            <td>' . $dimensions . '</td>
            <td>' . $size . '</td>
        </tr>';
    }
    $html .= '</tbody>';

    $html .= '</table>';
    $html .= '</div>';
    $html .= '</div>';

    return $html;
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
 *
 * @return array Response containing updated images, message, and image list HTML
 */
function sip_handle_image_upload() {
    $images = $_FILES['images'];
    $uploaded_images = array();
    $errors = array();

    // Get existing images to check for duplicates
    $existing_images = get_option('sip_printify_images', array());

    // Create an array of existing image filenames
    $existing_filenames = array_map(function ($image) {
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
            $sip_upload_dir = $upload_dir['basedir'] . '/sip-printify-manager/images/';
            $sip_upload_url = $upload_dir['baseurl'] . '/sip-printify-manager/images/';

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
                    'upload_time' => current_time('mysql'), // Add upload timestamp
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

    // Generate the updated image list HTML
    $image_list_html = sip_display_image_list($existing_images);

    return array(
        'images' => $existing_images,
        'message' => $message,
        'image_list_html' => $image_list_html
    );
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