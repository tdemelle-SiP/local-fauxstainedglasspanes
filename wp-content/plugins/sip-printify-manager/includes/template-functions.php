<?php

// Function to save a JSON template to a custom directory.
function sip_save_template($product, $template_name) {
    $upload_dir = wp_upload_dir();
    $template_dir = $upload_dir['basedir'] . '/sip-printify-manager/templates/';

    // Create the directory if it doesn't exist.
    if (!file_exists($template_dir)) {
        if (!wp_mkdir_p($template_dir)) {
            error_log('Failed to create template directory at: ' . $template_dir);
            return;
        }
        error_log('Created template directory at: ' . $template_dir);
    }

    // Format the template name to lowercase with underscores and "_template" suffix
    $base_name = sanitize_file_name(strtolower(str_replace(' ', '_', $template_name))) . '_template';
    $file_path = $template_dir . $base_name . '.json';

    // Check for existing templates and append numbers if necessary
    $counter = 1;
    while (file_exists($file_path)) {
        $file_path = $template_dir . $base_name . '_' . str_pad($counter, 2, '0', STR_PAD_LEFT) . '.json';
        $counter++;
    }

    // Save the template data
    if (file_put_contents($file_path, json_encode($product, JSON_PRETTY_PRINT))) {
        error_log("Template saved successfully at: $file_path");
    } else {
        error_log("Failed to save template at: $file_path");
    }
}

// Function to load JSON templates from the custom directory.
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

// Function to get the template directory path.
function sip_get_template_dir() {
    $upload_dir = wp_upload_dir();
    $template_dir = $upload_dir['basedir'] . '/sip-printify-manager/templates/';
    return $template_dir;
}

// Display the template list on the admin page.
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

// Function to delete a template by name.
function sip_delete_template($template_name) {
    $template_dir = sip_get_template_dir();
    $file_path = $template_dir . $template_name . '.json';

    error_log("Attempting to delete template file: $file_path");

    if (file_exists($file_path)) {
        $result = unlink($file_path);
        if ($result) {
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

// Function to rename a template.
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