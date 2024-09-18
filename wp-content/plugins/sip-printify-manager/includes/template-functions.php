<?php

/**
 * Save a product template to the custom directory.
 *
 * @param array $product The product data to save as a template.
 * @param string $template_name The name of the template.
 */
function sip_save_template($product, $template_name) {
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
 */
function sip_display_template_list($templates) {
    if (empty($templates)) {
        echo '<p>No templates found.</p>';
    } else {
        echo '<ul>';
        foreach ($templates as $template) {
            echo '<li>';
            echo '<input type="checkbox" name="selected_templates[]" value="' . esc_attr($template) . '"> ';
            echo esc_html($template);
            echo '</li>';
        }
        echo '</ul>';
    }
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
    $old_path = $template_dir . sanitize_file_name($old_name) . '.json';
    $new_path = $template_dir . sanitize_file_name($new_name) . '.json';

    if (file_exists($old_path)) {
        if (rename($old_path, $new_path)) {
            error_log("Template $old_name renamed to $new_name.");
            return true;
        } else {
            error_log("Failed to rename template from $old_name to $new_name.");
            return false;
        }
    } else {
        error_log("Template $old_name not found.");
        return false;
    }
}
