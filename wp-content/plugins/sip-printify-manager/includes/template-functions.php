<?php
// Exit if accessed directly
if (!defined('ABSPATH')) exit;

// Include the creation functions file
require_once plugin_dir_path(__FILE__) . 'creation-functions.php';

/**
 * Handle template actions triggered via AJAX.
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

        case 'create_new_products':
            $selected_template = isset($_POST['selected_templates']) ? sanitize_text_field($_POST['selected_templates'][0]) : '';
            if (empty($selected_template)) {
                wp_send_json_error('No template selected.');
            }
            $template_data = sip_get_template_json_from_file($selected_template);
            if (!$template_data) {
                wp_send_json_error('Failed to load template data.');
            }
            wp_send_json_success(array(
                'template_data' => $template_data,
                'template_action' => 'create_new_products',
                'message' => 'Template loaded successfully for new product creation.'
            ));
            break;

        case 'get_loaded_template':
            $loaded_template = get_option('sip_loaded_template', '');
            if (!empty($loaded_template)) {
                wp_send_json_success(array('template_data' => json_decode($loaded_template, true)));
            } else {
                wp_send_json_success(array('template_data' => null));
            }
            break;

        case 'set_loaded_template':
            if (!isset($_POST['template_data'])) {
                wp_send_json_error('No template data provided');
            }
            $template_data = wp_unslash($_POST['template_data']);
            update_option('sip_loaded_template', $template_data);
            wp_send_json_success(array('message' => 'Template data saved successfully'));
            break;

        case 'clear_loaded_template':
            delete_option('sip_loaded_template');
            wp_send_json_success();
            break;

        default:
            wp_send_json_error('Unknown template action.');
            break;
    }
}

/**
 * Save a product template to the custom directory.
 *
 * @param array $product The product data to save as a template.
 * @param string $template_name The name of the template.
 */
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
 * @return array List of template names.
 */
function sip_load_templates() {
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
 * @param array $templates List of template names to display.
 * @return string HTML content of the template list.
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
 * Get the JSON content of a template file.
 *
 * @param string $template_name The name of the template file (without .json extension).
 * @return array|false The decoded JSON content, or false if the file doesn't exist.
 */
function sip_get_template_json_from_file($template_name) {
    $template_dir = sip_get_template_dir();
    $file_path = $template_dir . $template_name . '.json';

    if (!file_exists($file_path)) {
        error_log('Template file does not exist at: ' . $file_path);
        return false;
    }

    $template_content = file_get_contents($file_path);
    return json_decode($template_content, true);
}
