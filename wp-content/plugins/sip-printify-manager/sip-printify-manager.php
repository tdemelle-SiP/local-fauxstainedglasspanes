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
 * This file initializes the SiP Printify Manager plugin, sets up necessary actions, filters,
 * and integrates other specialized components of the plugin.
 *
 * The core functionality is offloaded to specialized PHP files located in the 'includes' and 'views' directories:
 * - 'includes/shop-functions.php' handles shop-related functionalities like token management and encryption.
 * - 'includes/product-functions.php' manages product-related actions.
 * - 'includes/image-functions.php' manages image-related actions.
 * - 'includes/template-functions.php' deals with template management.
 * - 'includes/creation-functions.php' deals with managing editing of templates in the Product Creation Table.
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
$includes = [
    'shop-functions.php',
    'product-functions.php',
    'image-functions.php',
    'template-functions.php',
    'creation-functions.php',
    'icon-functions.php',
    'utilities.php'
];

foreach ($includes as $file) {
    require_once plugin_dir_path(__FILE__) . 'includes/' . $file;
}

/**
 * Class SiP_Printify_Manager
 *
 * Main class for the SiP Printify Manager plugin. It initializes the plugin, sets up actions and filters,
 * and handles the overall integration of the plugin components.
 *
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
     */
    private function __construct() {
        // Enqueue admin scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));

        // Handle AJAX requests
        // The actual AJAX handler functions are offloaded to specialized files
        add_action('wp_ajax_sip_handle_ajax_request', 'sip_handle_ajax_request');

        // Add CSS to hide admin notices on the custom admin page
        add_action('admin_head', 'sip_hide_admin_notices');

        add_action('admin_footer', 'sip_check_loaded_template');
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
    
        // Enqueue PhotoSwipe CSS
        wp_enqueue_style('photoswipe-css', 'https://unpkg.com/photoswipe@5.3.0/dist/photoswipe.css', [], '5.3.0');
    
        // Enqueue PhotoSwipe scripts
        wp_enqueue_script(
            'photoswipe',
            'https://unpkg.com/photoswipe@5.3.0/dist/photoswipe.esm.min.js',
            array(),
            '5.3.0',
            true
        );
    
        wp_enqueue_script(
            'photoswipe-lightbox',
            'https://unpkg.com/photoswipe@5.3.0/dist/photoswipe-lightbox.esm.min.js',
            array('photoswipe'),
            '5.3.0',
            true
        );
    
        // Enqueue PhotoSwipe initialization script
        wp_enqueue_script(
            'photoswipe-init',
            plugin_dir_url(__FILE__) . 'assets/js/photoswipe-init.js',
            array('photoswipe-lightbox'),
            '1.0.0',
            true
        );
    
        // Add the script_loader_tag filter to add type="module"
        add_filter('script_loader_tag', array($this, 'add_type_attribute'), 10, 3);
    
        // Enqueue jQuery UI
        wp_enqueue_script('jquery-ui-resizable');
        wp_enqueue_script('jquery-ui-draggable');
    
        // Enqueue your custom JS files in the correct order
        // Enqueue sip-utilities
        wp_enqueue_script(
            'sip-utilities',
            plugin_dir_url(__FILE__) . 'assets/js/core/utilities.js',
            array('jquery'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-ajax
        wp_enqueue_script(
            'sip-ajax',
            plugin_dir_url(__FILE__) . 'assets/js/core/ajax.js',
            array('jquery', 'sip-utilities'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-product-actions
        wp_enqueue_script(
            'sip-product-actions',
            plugin_dir_url(__FILE__) . 'assets/js/modules/product-actions.js',
            array('jquery', 'sip-ajax', 'sip-utilities'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-image-actions
        wp_enqueue_script(
            'sip-image-actions',
            plugin_dir_url(__FILE__) . 'assets/js/modules/image-actions.js',
            array('jquery', 'sip-ajax', 'sip-utilities'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-template-actions
        wp_enqueue_script(
            'sip-template-actions',
            plugin_dir_url(__FILE__) . 'assets/js/modules/template-actions.js',
            array('jquery', 'sip-ajax', 'sip-utilities'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-creation-actions
        wp_enqueue_script(
            'sip-creation-actions',
            plugin_dir_url(__FILE__) . 'assets/js/modules/creation-actions.js',
            array('jquery', 'sip-ajax', 'sip-utilities'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-template-editor
        wp_enqueue_script(
            'sip-template-editor',
            plugin_dir_url(__FILE__) . 'assets/js/modules/template-editor.js',
            array('jquery', 'sip-ajax', 'sip-utilities', 'codemirror'),
            '1.0.0',
            true
        );
    
        // Enqueue sip-init
        wp_enqueue_script(
            'sip-init',
            plugin_dir_url(__FILE__) . 'assets/js/init.js',
            array(
                'jquery',
                'sip-utilities',
                'sip-ajax',
                'sip-product-actions',
                'sip-image-actions',
                'sip-template-actions',
                'sip-template-editor',
                'sip-creation-actions'
            ),
            '1.0.0',
            true
        );
    
        // Enqueue sip-main (should be last)
        wp_enqueue_script(
            'sip-main',
            plugin_dir_url(__FILE__) . 'assets/js/main.js',
            array('sip-init'),
            '1.0.0',
            true
        );
    
        // Enqueue your custom CSS
        wp_enqueue_style(
            'sip-printify-manager-style',
            plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager.css',
            array(),
            '1.0.0'
        );

        // Get the PHP setting for max_file_uploads
        $php_limits = sip_get_php_limits();

        // Localize script to pass PHP variables to JavaScript
        wp_localize_script('sip-ajax', 'sipAjax', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('sip_printify_manager_nonce'),
            'php_limits' => $php_limits
        ]);
    }

    public function add_type_attribute($tag, $handle, $src) {
        // Add script handles to the array below
        $module_scripts = ['photoswipe', 'photoswipe-lightbox', 'photoswipe-init'];
    
        if (in_array($handle, $module_scripts)) {
            // Add type="module" to the script tag
            $tag = str_replace('<script ', '<script type="module" ', $tag);
        }
        return $tag;
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



function sip_check_loaded_template() {
    $loaded_template = get_option('sip_loaded_template', '');
    if (!empty($loaded_template)) {
        ?>
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            var templateData = <?php echo $loaded_template; ?>;
            sip.templateActions.populateCreationTable(templateData);
        });
        </script>
        <?php
    }
}

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
        case 'shop_action':
            sip_handle_shop_action();
            break;

        case 'product_action':
            sip_handle_product_action();
            break;

        case 'image_action':
            sip_handle_image_action();
            break;

        case 'template_action':
            sip_handle_template_action();
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