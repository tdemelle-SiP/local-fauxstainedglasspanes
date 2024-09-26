<?php
/*
Plugin Name: SiP Printify Manager
Description: A plugin to help manage your Printify Shop, Products, and Images
Version: 2.1
Author: Stuff is Parts, LLC
*/

// Prevent direct access to the file for security reasons
if (!defined('ABSPATH')) exit;

/**
 * Main Plugin File: sip-printify-manager.php
 *
 * This file initializes the SiP Printify Manager plugin, sets up necessary actions, filters, and shortcodes,
 * and integrates other specialized components of the plugin.
 *
 * The core functionality is offloaded to specialized PHP files located in the 'includes' and 'views' directories:
 * - 'includes/shop-functions.php' handles shop-related functionalities like token management and encryption.
 * - 'includes/product-functions.php' manages product-related actions.
 * - 'includes/image-functions.php' manages image-related actions.
 * - 'includes/template-functions.php' deals with template management.
 * - 'views/admin-page.php' contains the HTML and PHP code for rendering the plugin's admin page.
 *
 * By offloading these functionalities to specialized files, we ensure better code organization, maintainability,
 * and prevent code duplication or unintended additions to the core file.
 */

/**
 * Include the SiP Plugin Framework
 *
 * This framework serves as a base for initializing and managing SiP plugins within the WordPress admin interface.
 * It handles plugin initialization, admin menu integration, and ensures core dependencies are active.
 */
require_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugin-framework.php');

/**
 * Include Specialized Functionality Files
 *
 * We include the specialized PHP files that contain functions for handling specific parts of the plugin.
 * This modular approach keeps the main plugin file clean and focused on initialization.
 */
require_once plugin_dir_path(__FILE__) . 'includes/shop-functions.php';      // Shop-related functions
require_once plugin_dir_path(__FILE__) . 'includes/product-functions.php';   // Product-related functions
require_once plugin_dir_path(__FILE__) . 'includes/image-functions.php';     // Image-related functions
require_once plugin_dir_path(__FILE__) . 'includes/template-functions.php';  // Template-related functions

/**
 * Class SiP_Printify_Manager
 *
 * Main class for the SiP Printify Manager plugin. It initializes the plugin, sets up actions and filters,
 * and handles the overall integration of the plugin components.
 *
 * Note: Most of the functionality has been offloaded to specialized PHP files in the 'includes' directory.
 * This helps in keeping the core plugin file organized and ensures that related functionalities are grouped
 * together, making future maintenance and updates more manageable.
 */
class SiP_Printify_Manager {
    // Singleton instance
    private static $instance = null;

    /**
     * Constructor
     *
     * Initializes the plugin by setting up actions, filters, and including necessary scripts.
     * Note: Most of the functionality has been offloaded to specialized files in the 'includes' directory.
     */
    private function __construct() {
        // Enqueue admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));

        // Handle AJAX requests
        // The actual AJAX handler functions are offloaded to specialized files
        add_action('wp_ajax_sip_handle_ajax_request', 'sip_handle_ajax_request');

        // Handle AJAX requests for image uploads
        add_action('wp_ajax_sip_upload_images', 'sip_handle_image_upload');

        // Removed the undefined enqueue_jquery_ui hook to prevent PHP fatal error
        // add_action('wp_enqueue_scripts', 'enqueue_jquery_ui');

        // Hook for saving template content
        add_action('wp_ajax_sip_save_template_content', 'sip_save_template_content');

        // Register the shortcode for displaying products (if needed)
        // The rendering function can be offloaded if it grows in complexity
        add_shortcode('sip_printify_products', 'render_products_shortcode');

        // Add CSS to hide admin notices on the custom admin page
        add_action('admin_head', array($this, 'hide_admin_notices_with_css'));
    }

    /**
     * Get Instance
     *
     * Implements the singleton pattern to ensure only one instance of the class exists.
     *
     * @return SiP_Printify_Manager The singleton instance of the class.
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Enqueue Admin Scripts and Styles
     *
     * Enqueues necessary CSS and JavaScript files for the admin page.
     * The actual CSS and JS files are located in the 'assets' directory.
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'sip-plugins_page_sip-printify-manager') {
            return;
        }

        // Enqueue jQuery UI CSS (choose a theme or custom CSS as needed)
        wp_enqueue_style( 'jquery-ui-css', 'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css' );

        // Enqueue jQuery UI scripts for resizable and draggable functionality
        wp_enqueue_script('jquery-ui-resizable');
        wp_enqueue_script('jquery-ui-draggable');

        // Enqueue the CodeMirror scripts and styles provided by WordPress
        wp_enqueue_script('wp-codemirror');
        wp_enqueue_style('wp-codemirror');
    
        // Prettier Standalone and Babel Parser Scripts
        wp_enqueue_script('prettier-standalone', 'https://cdn.jsdelivr.net/npm/prettier@2.3.2/standalone.js', array(), null, true);
        wp_enqueue_script('prettier-parser-babel', 'https://cdn.jsdelivr.net/npm/prettier@2.3.2/parser-babel.js', array('prettier-standalone'), null, true);
        wp_enqueue_script('prettier-parser-html', 'https://cdn.jsdelivr.net/npm/prettier@2.3.2/parser-html.js', array('prettier-standalone'), null, true);

        // Enqueue styles
        wp_enqueue_style('dashicons');
        wp_enqueue_style('sip-printify-manager-style', plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager.css');
    
        // Enqueue the sip-ajax.js script with dependencies on jQuery, wp-codemirror
        wp_enqueue_script('sip-ajax-script', plugin_dir_url(__FILE__) . 'assets/js/sip-ajax.js', array('jquery', 'wp-codemirror', 'jquery-ui-resizable'), null, true);
    
        // Localize script to pass AJAX URL and nonce
        wp_localize_script('sip-ajax-script', 'sipAjax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('sip_printify_manager_nonce')
        ));
    }

    /**
     * Hide Admin Notices with CSS
     *
     * Adds inline CSS to hide admin notices on the plugin's admin page.
     * This helps in providing a cleaner interface to the user.
     */
    public function hide_admin_notices_with_css() {
        $current_screen = get_current_screen();
        if ($current_screen && $current_screen->id === 'toplevel_page_sip-printify-manager') {
            echo '<style>.notice { display: none !important; }</style>';
        }
    }

    /**
     * Render Admin Page
     *
     * Includes the admin page view from the 'views' directory.
     * This offloads the HTML content to a separate file for better organization and separation of concerns.
     * It helps prevent HTML and presentation logic from cluttering the main plugin file.
     */
    public static function render_admin_page() {
        // Include the admin page view
        include plugin_dir_path(__FILE__) . 'views/admin-page.php';
    }

    /**
     * Activation Hook
     *
     * Runs code when the plugin is activated.
     * We generate the encryption key upon activation, using the function defined in 'includes/shop-functions.php'.
     * This offloads the key generation logic to a specialized file.
     */
    public static function activate_plugin() {
        // Generate the encryption key upon plugin activation
        sip_generate_encryption_key();
    }
}

/**
 * Initialize the Plugin
 *
 * Creates an instance of the main plugin class and sets up the plugin using the SiP Plugin Framework.
 * By initializing the plugin here, we ensure that all necessary actions and filters are registered.
 */
SiP_Printify_Manager::get_instance();

// Register activation hook
register_activation_hook(__FILE__, array('SiP_Printify_Manager', 'activate_plugin'));

// Initialize the plugin with the SiP Plugin Framework
SiP_Plugin_Framework::init_plugin(
    'SiP Printify Manager',
    __FILE__,
    'SiP_Printify_Manager'
);

/**
 * Handle AJAX Requests
 *
 * Central function to handle all AJAX requests coming from the plugin's admin page.
 * Delegates actions to specialized functions in the included files.
 *
 * By offloading specific action handlers to specialized files, we maintain a clean separation of concerns
 * and ensure that functionalities are managed in their appropriate contexts.
 * This helps prevent the main plugin file from becoming cluttered with code that is better managed elsewhere.
 */
function sip_handle_ajax_request() {
    // Verify the AJAX nonce for security
    if (!check_ajax_referer('sip_printify_manager_nonce', 'nonce', false)) {
        wp_send_json_error('Security check failed');
        wp_die();
    }

    // Get the action type from the AJAX request
    $action_type = isset($_POST['action_type']) ? sanitize_text_field($_POST['action_type']) : '';


    // Switch based on the action type to delegate to the appropriate function
    switch ($action_type) {
        case 'save_token':
            /**
             * Token management functions are handled in 'includes/shop-functions.php'.
             * This includes saving the token and storing shop details.
             */
            sip_save_token();
            break;
        case 'new_token':
            /**
             * Token reset functionality is in 'includes/shop-functions.php'.
             * It clears the stored token and associated shop data.
             */
            sip_new_token();
            break;
        case 'product_action':
            /**
             * Product-related actions are handled in 'includes/product-functions.php'.
             * This includes reloading products, creating templates, and removing products from the manager.
             */
            sip_handle_product_action();
            break;
        case 'image_action':
            /**
             * Image-related actions are handled in 'includes/image-functions.php'.
             * This includes reloading images, uploading images, and removing images from the manager.
             */
            sip_handle_image_action();
            break;
        case 'upload_images':
            /**
             * Handling image uploads is in 'includes/image-functions.php'.
             * This function processes images uploaded via drag-and-drop or file selection.
             */
            sip_handle_image_upload();
            break;
        case 'template_action':
            /**
             * Template-related actions are handled in 'includes/template-functions.php'.
             * This includes deleting, renaming, and editing templates.
             */
            sip_handle_template_action();
            break;
        case 'save_template':
            /**
             * Saving template content is handled in 'includes/template-functions.php'.
             * This function saves the edited content of a template file.
             */
            sip_save_template_content();
            break;
        default:
            // Invalid action type
            wp_send_json_error('Invalid action.');
            break;
    }
}

/**
 * Render Products Shortcode
 *
 * (Optional) Function to render products via a shortcode.
 * This function could be offloaded to 'includes/product-functions.php' if preferred.
 * By keeping it here, we maintain visibility of the shortcode registration.
 */
function render_products_shortcode($atts) {
    // This function could be offloaded to 'includes/product-functions.php' if it grows in complexity
    $products = get_option('sip_printify_products');
    ob_start();
    if (!empty($products)) {
        sip_display_product_list($products);
    } else {
        echo '<p>No products found.</p>';
    }
    return ob_get_clean();
}