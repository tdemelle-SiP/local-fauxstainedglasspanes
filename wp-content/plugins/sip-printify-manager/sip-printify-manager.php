<?php
/*
Plugin Name: SiP Printify Manager
Description: A plugin to help manage your Printify Shop, Products, and Images
Version: 2.1
Author: Stuff is Parts, LLC
*/

// Prevent direct access to the file for security reasons
if (!defined('ABSPATH')) {
    exit;
}

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
require_once WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugin-framework.php';

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
require_once plugin_dir_path(__FILE__) . 'includes/creation-functions.php';
require_once plugin_dir_path(__FILE__) . 'includes/svg-icons.php';
require_once plugin_dir_path(__FILE__) . 'includes/icon-functions.php';

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
    /**
     * Singleton instance
     *
     * @var SiP_Printify_Manager|null
     */
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

        // Hook for saving template content
        add_action('wp_ajax_sip_save_template_content', 'sip_save_template_content');

        // Register the shortcode for displaying products (if needed)
        // The rendering function can be offloaded if it grows in complexity
        add_shortcode('sip_printify_products', 'render_products_shortcode');

        // Add CSS to hide admin notices on the custom admin page
        add_action('admin_head', array($this, 'hide_admin_notices_with_css'));

        // Register AJAX handler for image actions
        add_action('wp_ajax_sip_handle_image_action', 'sip_handle_image_action');

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

    public function enqueue_admin_scripts($hook) 
    {
        if ($hook !== 'sip-plugins_page_sip-printify-manager') {
            return;
        }
    
        // Enqueue CodeMirror from CDN
        wp_enqueue_script('codemirror', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js', array(), '5.65.13', true);
        wp_enqueue_style('codemirror', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css', array(), '5.65.13');

        // Enqueue CodeMirror addons
        $addons = ['foldcode', 'foldgutter', 'brace-fold', 'comment-fold'];
        foreach ($addons as $addon) {
            wp_enqueue_script("codemirror-addon-{$addon}", "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/{$addon}.min.js", ['codemirror'], '5.65.13', true);
        }
        wp_enqueue_style('codemirror-addon-foldgutter-style', 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldgutter.min.css', ['codemirror'], '5.65.13');

    
        // Enqueue jQuery UI
        wp_enqueue_script('jquery-ui-resizable');
        wp_enqueue_script('jquery-ui-draggable');
    
        // Enqueue your custom CSS
        wp_enqueue_style(
            'sip-printify-manager-style',
            plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager.css',
            array(),
            '1.0.0'
        );
    
        // Enqueue your custom JS files
    
        // Enqueue sip-spinner
        wp_enqueue_script(
            'sip-spinner',
            plugin_dir_url(__FILE__) . 'assets/js/spinner.js',
            array('jquery'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-ajax
        wp_enqueue_script(
            'sip-ajax',
            plugin_dir_url(__FILE__) . 'assets/js/ajax.js',
            array('jquery', 'codemirror', 'jquery-ui-resizable', 'jquery-ui-draggable'),
            '1.0.0',
            true
        );
        
        // Enqueue sip-event-handlers
        wp_enqueue_script(
            'sip-event-handlers',
            plugin_dir_url(__FILE__) . 'assets/js/eventHandlers.js',
            array('jquery', 'sip-ajax'),
            '1.0.0',
            true
        );

        // Enqueue sip-image-upload
        wp_enqueue_script(
            'sip-image-upload',
            plugin_dir_url(__FILE__) . 'assets/js/imageUpload.js',
            array('jquery', 'sip-ajax'),
            '1.0.0',
            true
        );

        // Enqueue sip-product-creation
        wp_enqueue_script(
            'sip-product-creation',
            plugin_dir_url(__FILE__) . 'assets/js/productCreation.js',
            array('jquery', 'sip-ajax'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-template-editor
        wp_enqueue_script(
            'sip-template-editor',
            plugin_dir_url(__FILE__) . 'assets/js/templateEditor.js',
            array('jquery', 'sip-ajax', 'codemirror'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-main
        wp_enqueue_script(
            'sip-main',
            plugin_dir_url(__FILE__) . 'assets/js/main.js',
            array(
                'jquery',
                'sip-spinner',
                'sip-ajax',
                'sip-product-creation',
                'sip-template-editor',
                'sip-image-upload',
                'sip-event-handlers'
            ),
            '1.0.0',
            true
        );
    
        // Get the PHP setting for max_file_uploads
        $max_file_uploads = ini_get('max_file_uploads');
        $max_filesize = sip_convert_to_bytes(ini_get('upload_max_filesize'));
        $post_max_size = sip_convert_to_bytes(ini_get('post_max_size'));
        $memory_limit = sip_convert_to_bytes(ini_get('memory_limit'));

        // Localize script to pass PHP variables to JavaScript
        wp_localize_script('sip-ajax', 'sipAjax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('sip_printify_manager_nonce'),
            'max_file_uploads' => $max_file_uploads,
            'max_filesize' => $max_filesize,
            'post_max_size' => $post_max_size,
            'memory_limit' => $memory_limit
        ));
    }



    /**
     * Hide Admin Notices with CSS
     *
     * Adds inline CSS to hide admin notices on the plugin's admin page.
     * This helps in providing a cleaner interface to the user by removing unnecessary alerts or messages.
     */
    public function hide_admin_notices_with_css() {
        // Get the current admin screen
        $current_screen = get_current_screen();

        // Check if we are on the plugin's admin page
        if ($current_screen && $current_screen->id === 'sip-plugins_page_sip-printify-manager') {
            echo '<style>
                /* Hide all admin notices */
                .notice, .updated, .error, .success {
                    display: none !important;
                }
            </style>';
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
 * Convert shorthand notation in php.ini to bytes.
 *
 * @param string $value Value from php.ini settings.
 * @return int Converted value in bytes.
 */
function sip_convert_to_bytes($value) {
    $value = trim($value);
    $last = strtolower($value[strlen($value) - 1]);
    $num = (int) $value;

    switch ($last) {
        case 'g':
            $num *= 1024;
        case 'm':
            $num *= 1024;
        case 'k':
            $num *= 1024;
    }

    return $num;
}

// Initialize the plugin instance
SiP_Printify_Manager::get_instance();

/**
 * Register Activation Hook
 *
 * Registers the plugin's activation hook to run specific functions upon activation.
 * In this case, it generates an encryption key necessary for the plugin's operations.
 */
register_activation_hook(__FILE__, array('SiP_Printify_Manager', 'activate_plugin'));

/**
 * Initialize the Plugin with the SiP Plugin Framework
 *
 * This initializes the plugin using the SiP Plugin Framework, which handles plugin setup, admin menu integration,
 * and ensures that all necessary components are loaded.
 */
SiP_Plugin_Framework::init_plugin(
    'SiP Printify Manager',        // Plugin Name
    __FILE__,                      // Plugin File
    'SiP_Printify_Manager'        // Main Class Name
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
    if (!isset($_POST['nonce']) || !check_ajax_referer('sip_printify_manager_nonce', 'nonce', false)) {
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
        case 'creation_action':
            sip_handle_creation_action();
            break;
        default:
            // Invalid action type
            wp_send_json_error('Invalid action.');
            break;
    }
}