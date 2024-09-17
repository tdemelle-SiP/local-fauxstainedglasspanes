<?php
// File: wp-content/plugins/sip-plugins-core/sip-plugin-framework.php

// Prevent direct access to the file for security reasons
if (!defined('ABSPATH')) exit;

/**
 * Class SiP_Plugin_Framework
 *
 * This class serves as a framework for initializing and managing Stuff is Parts, LLC (SiP) plugins
 * within the WordPress admin interface. It handles plugin initialization, admin menu integration,
 * and ensures core dependencies are active.
 */
class SiP_Plugin_Framework {
    
    /**
     * Initializes a SiP plugin by setting up its admin submenu and ensuring core dependencies.
     *
     * @param string $name        The display name of the plugin.
     * @param string $file        The main plugin file path.
     * @param string $class_name  The name of the class responsible for rendering the admin page.
     */
    public static function init_plugin($name, $file, $class_name) {
        // Hook into WordPress's 'admin_menu' action to add the plugin's submenu
        add_action('admin_menu', function() use ($name, $file, $class_name) {
            // Generate a URL-friendly slug from the plugin name
            $slug = sanitize_title($name);
            
            // Add a new submenu page under the 'sip-plugins' parent menu
            add_submenu_page(
                'sip-plugins',        // Parent slug
                $name,                // Page title
                $name,                // Menu title
                'manage_options',     // Capability required to access the menu
                $slug,                // Menu slug
                // Callback function to render the submenu page content
                function() use ($class_name, $name) {
                    echo '<div class="wrap">';
                    // Link to navigate back to the main SiP Plugins Suite page
                    echo '<p><a href="' . admin_url('admin.php?page=sip-plugins') . '">&larr; Back to Stuff is Parts, LLC Plugins Suite Main Page</a></p>';
                    // Call the 'render_admin_page' method of the specified class to display the page content
                    call_user_func(array($class_name, 'render_admin_page'));
                    echo '</div>';
                }
            );
        });

        // Register a plugin activation hook to ensure the core SiP plugin is active
        register_activation_hook($file, function() {
            // Define the path to the core SiP plugin
            $core_plugin = 'sip-plugins-core/sip-plugins-core.php';
            // Check if the core plugin is not active
            if (!is_plugin_active($core_plugin)) {
                // Activate the core plugin programmatically
                activate_plugin($core_plugin);
            }
        });
    }

    /**
     * Retrieves all active SiP plugins excluding the core SiP plugin.
     *
     * @return array An array of active SiP plugins.
     */
    public static function get_all_sip_plugins() {
        // Get all installed plugins
        $all_plugins = get_plugins();
        // Filter plugins to include only those that start with 'sip-' and exclude the core plugin
        return array_filter($all_plugins, function($plugin, $file) {
            return strpos($file, 'sip-') === 0 && $file !== 'sip-plugins-core/sip-plugins-core.php';
        }, ARRAY_FILTER_USE_BOTH);
    }
}
