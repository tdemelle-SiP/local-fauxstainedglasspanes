<?php

/**
 * Save a product template to the custom directory.
 *
 * This function saves the given product data as a JSON file in the custom templates directory.
 * If the directory does not exist, it will be created. The function also handles duplicate file names.
 *
 * @param array $product The product data to save as a template.
 * @param string $template_name The name of the template.
 */

// Include the creation functions file
require_once plugin_dir_path(__FILE__) . 'creation-functions.php';

function sip_save_template($product, $template_name) {
    // Get the WordPress upload directory
    $upload_dir = wp_upload_dir();
    $template_dir = $upload_dir['basedir'] . '/sip-printify-manager/templates/';

    // Create directory if it doesn't exist
    if (!file_exists($template_dir)) {
        if (!wp_mkdir_p($template_dir)) {
            error_log('Failed to create template directory at: ' . $template_dir);
            return;
        }
        error_log('Created template directory at: ' . $template_dir);
    }

    // Format template name and handle duplicates
    $base_name = sanitize_file_name(strtolower(str_replace(' ', '_', $template_name))) . '_template';
    $file_path = $template_dir . $base_name . '.json';

    $counter = 1;
    while (file_exists($file_path)) {
        $file_path = $template_dir . $base_name . '_' . str_pad($counter, 2, '0', STR_PAD_LEFT) . '.json';
        $counter++;
    }

    // Save template as JSON
    if (file_put_contents($file_path, json_encode($product, JSON_PRETTY_PRINT))) {
        error_log("Template saved successfully at: $file_path");
    } else {
        error_log("Failed to save template at: $file_path");
    }
}

/**
 * Load all available templates from the custom directory.
 *
 * This function scans the templates directory and returns an array of template names.
 *
 * @return array List of template names.
 */
function sip_load_templates() {
    // Get the WordPress upload directory
    $upload_dir = wp_upload_dir();
    $template_dir = $upload_dir['basedir'] . '/sip-printify-manager/templates/';

    $templates = array();
    if (file_exists($template_dir)) {
        $files = glob($template_dir . '*.json');
        foreach ($files as $file) {
            $templates[] = basename($file, '.json');
        }
    }

    error_log('Loaded templates: ' . print_r($templates, true));
    return $templates;
}

/**
 * Get the template directory path.
 *
 * This function returns the full path to the template directory.
 *
 * @return string The path to the template directory.
 */
function sip_get_template_dir() {
    $upload_dir = wp_upload_dir();
    $template_dir = $upload_dir['basedir'] . '/sip-printify-manager/templates/';
    return $template_dir;
}

/**
 * Display the list of templates in the WordPress admin interface.
 *
 * This function outputs the list of templates as a table with a sticky header.
 * The header includes a select-all checkbox and a label "Template Name".
 *
 * @param array $templates List of template names to display.
 */
function sip_display_template_list($templates) {
    if (empty($templates)) {
        return '<div id="no-templates-found" style="padding: 10px;">
            <p>' . esc_html__('To Make A Template, Select a Product above, Choose "Create Template" and Press Execute.', 'sip-printify-manager') . '</p>
        </div>';
    }
    
    $html = '<div id="template-table-container">';
    $html .= '<table id="template-table-header">';
    $html .= '<colgroup>
        <col style="width: 8%;">
        <col style="width: 92%;">
    </colgroup>';
    $html .= '<thead>
        <tr>
            <th><input type="checkbox" id="select-all-templates"></th>
            <th>' . esc_html__('Template Name', 'sip-printify-manager') . '</th>
        </tr>
    </thead>';
    $html .= '</table>';

    $html .= '<div id="template-table-body">';
    $html .= '<table id="template-table-content">';
    $html .= '<colgroup>
        <col style="width: 8%;">
        <col style="width: 92%;">
    </colgroup>';
    
    $html .= '<tbody>';
    foreach ($templates as $template) {
        $html .= '<tr>
            <td><input type="checkbox" name="selected_templates[]" value="' . esc_attr($template) . '" /></td>
            <td>' . esc_html($template) . '</td>
        </tr>';
    }
    $html .= '</tbody>';

    $html .= '</table>';
    $html .= '</div>';
    $html .= '</div>';

    return $html;
}

/**
 * Delete a specific template by name.
 *
 * This function deletes the specified template file from the template directory.
 *
 * @param string $template_name The name of the template to delete.
 * @return bool True on success, false on failure.
 */
function sip_delete_template($template_name) {
    $template_dir = sip_get_template_dir();
    $file_path = $template_dir . $template_name . '.json';

    error_log("Attempting to delete template file: $file_path");

    if (file_exists($file_path)) {
        if (unlink($file_path)) {
            error_log("Template $template_name deleted successfully.");
            return true;
        } else {
            error_log("Failed to delete template $template_name. Check file permissions.");
            return false;
        }
    } else {
        error_log("Template file not found: $file_path");
        return false;
    }
}

/**
 * Rename a specific template.
 *
 * This function renames the specified template file in the template directory.
 *
 * @param string $old_name The current name of the template.
 * @param string $new_name The new name to assign to the template.
 * @return bool True on success, false on failure.
 */

 function sip_rename_template($old_name, $new_name) {
    $template_dir = sip_get_template_dir();
    $old_file = $template_dir . $old_name . '.json';
    $new_file = $template_dir . $new_name . '.json';

    if (!file_exists($old_file)) {
        return false;
    }

    return rename($old_file, $new_file);
}

/**
 * Handle template actions triggered via AJAX.
 *
 * This function handles actions like deleting, editing, renaming templates, and creating new products from templates based on AJAX requests.
 */
function sip_handle_template_action() {
    if (!check_ajax_referer('sip_printify_manager_nonce', 'nonce', false)) {
        wp_send_json_error('Security check failed');
    }

    $template_action = isset($_POST['template_action']) ? sanitize_text_field($_POST['template_action']) : '';

    switch ($template_action) {
        case 'delete_template':
            $selected_templates = isset($_POST['selected_templates']) ? $_POST['selected_templates'] : array();
            $deleted_count = 0;
            foreach ($selected_templates as $templateId) {
                if (sip_delete_template(sanitize_text_field($templateId))) {
                    $deleted_count++;
                }
            }
        
            // Load the updated list of templates
            $templates = sip_load_templates();
        
            $template_list_html = sip_display_template_list($templates);
        
            // Send a JSON response back to the AJAX call with the updated HTML content
            wp_send_json_success(array(
                'template_list_html' => $template_list_html,
                'message' => "$deleted_count template(s) deleted successfully."
            ));
            break;

        case 'rename_template':
            $old_template_name = isset($_POST['old_template_name']) ? sanitize_text_field($_POST['old_template_name']) : '';
            $new_template_name = isset($_POST['new_template_name']) ? sanitize_text_field($_POST['new_template_name']) : '';

            if (!empty($old_template_name) && !empty($new_template_name)) {
                $old_file_path = sip_get_template_dir() . $old_template_name . '.json';
                $new_file_path = sip_get_template_dir() . $new_template_name . '.json';

                if (file_exists($old_file_path)) {
                    // Rename the template file
                    if (rename($old_file_path, $new_file_path)) {
                        wp_send_json_success(array(
                            'old_template_name' => $old_template_name,
                            'new_template_name' => $new_template_name
                        ));
                    } else {
                        wp_send_json_error('Error renaming the template file.');
                    }
                } else {
                    wp_send_json_error('Old template file not found.');
                }
            } else {
                wp_send_json_error('Template names cannot be empty.');
            }
            break;

        case 'edit_template':
            // Extract the template name directly from the POST data
            $template_name = isset($_POST['template_name']) ? sanitize_text_field($_POST['template_name']) : '';

            if (!empty($template_name)) {
                $file_path = sip_get_template_dir() . $template_name . '.json';

                // Check if the template file exists
                if (file_exists($file_path)) {
                    // Get the content of the template file
                    $template_content = file_get_contents($file_path);
                    // Send the template content back to the AJAX call
                    wp_send_json_success(array(
                        'template_content' => $template_content,
                        'template_name'    => $template_name
                    ));
                } else {
                    // Send an error if the file is not found
                    wp_send_json_error('Template file not found.');
                }
            } else {
                // Send an error if no template name is provided
                wp_send_json_error('No template name provided.');
            }
            break;
            
        default:
            wp_send_json_error('Unknown template action.');
            break;
    }
}


/**
 * Save the edited template content from the template editor.
 *
 * This function saves the edited template content back to the JSON file.
 */
function sip_save_template_content() {
    check_ajax_referer('sip_printify_manager_nonce', '_ajax_nonce');

    $template_name    = sanitize_text_field($_POST['template_name']);
    $template_content = wp_unslash($_POST['template_content']);
    $file_path        = sip_get_template_dir() . $template_name . '.json';

    if (file_exists($file_path)) {
        if (file_put_contents($file_path, $template_content)) {
            wp_send_json_success('Template saved successfully.');
        } else {
            wp_send_json_error('Failed to save template.');
        }
    } else {
        wp_send_json_error('Template file not found.');
    }
}
