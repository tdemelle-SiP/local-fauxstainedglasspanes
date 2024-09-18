<?php
/*
Plugin Name: SiP Printify Manager
Description: A plugin to help manage your Printify Shop and its Products
Version: 1.6
Author: Stuff is Parts, LLC
*/

// Prevent direct access to the file for security reasons
if (!defined('ABSPATH')) exit;

/**
 * Class SiP_Plugin_Framework
 *
 * This class serves as a framework for initializing and managing Stuff is Parts, LLC (SiP) plugins
 * within the WordPress admin interface. It handles plugin initialization, admin menu integration,
 * and ensures core dependencies are active.
 */
require_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugin-framework.php');

/**
 * Class SiP_Printify_Manager
 *
 * Main class for the SiP Printify Manager plugin. It handles API connections, store management,
 * product and template management, and integrates necessary scripts and shortcodes.
 */
class SiP_Printify_Manager {
    // Singleton instance
    private static $instance = null;

    // Plugin options stored in the database
    private static $options;

    // Plugin directory path
    private static $plugin_dir;

    /**
     * Constructor
     *
     * Initializes plugin options, includes necessary files, and sets up actions and filters.
     */
    private function __construct() {
        // Retrieve plugin options from the database or initialize as an empty array
        self::$options = get_option('sip_printify_manager_options', array());

        // Set the plugin directory path
        self::$plugin_dir = plugin_dir_path(__FILE__);

        // Include Necessary Files
        require_once self::$plugin_dir . 'includes/shop-functions.php';
        require_once self::$plugin_dir . 'includes/product-functions.php';
        require_once self::$plugin_dir . 'includes/template-functions.php';

        // Set Up Actions and Filters
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_admin_scripts'));
        add_action('wp_ajax_sip_handle_ajax_request', array(__CLASS__, 'handle_ajax_request'));
        add_shortcode('sip_printify_products', array(__CLASS__, 'render_products_shortcode'));

        // Add CSS to hide admin notices on the custom admin page
        add_action('admin_head', array($this, 'hide_admin_notices_with_css'));
    }

    /**
     * Function to hide admin notices using CSS on the custom admin page
     */
    public function hide_admin_notices_with_css() {
        $current_screen = get_current_screen();
        if ($current_screen && $current_screen->id === 'toplevel_page_sip-printify-manager') {
            echo '<style>.notice { display: none !important; }</style>';
        }
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
     * Handle AJAX Requests
     *
     * Processes AJAX requests and routes them to the appropriate handler based on action type.
     */
    public static function handle_ajax_request() {
        check_ajax_referer('sip_printify_manager_nonce', 'nonce');

        $action_type = sanitize_text_field($_POST['action_type']);

        switch ($action_type) {
            case 'save_token':
                self::save_token();
                break;
            case 'reauthorize':
                self::reauthorize();
                break;
            case 'new_token':
                self::new_token();
                break;
            case 'product_action':
                self::handle_product_action();
                break;
            case 'template_action':
                self::handle_template_action();
                break;
            case 'save_template':
                self::save_template();
                break;
            default:
                wp_send_json_error('Invalid action.');
                break;
        }
    }

    // Enqueue Admin Scripts and Styles
    public static function enqueue_admin_scripts($hook) {
        wp_enqueue_style('dashicons');
        wp_enqueue_style('sip-printify-manager-style', plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager.css');
        wp_enqueue_script('sip-printify-manager-script', plugin_dir_url(__FILE__) . 'assets/js/sip-printify-manager.js', array('jquery'), null, true);
        wp_enqueue_script('sip-ajax-script', plugin_dir_url(__FILE__) . 'assets/js/sip-ajax.js', array('jquery'), null, true);
        
        wp_localize_script('sip-ajax-script', 'sipAjax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('sip_printify_manager_nonce')
        ));
    }

    /**
     * Render Admin Page
     *
     * Outputs the HTML content for the plugin's admin page, including API connection setup,
     * shop details, product and template management interfaces.
     */
    public static function render_admin_page() {
        $token = get_option('printify_bearer_token');
        $shop_name = get_option('sip_printify_shop_name');
        $products = get_option('sip_printify_products');
        $templates = sip_load_templates();

        ?>
        <div id="sip-printify-manager-page">
            <div class="wrap">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h1 style="margin: 0;">Welcome to SIP Printify Manager!</h1>
                    <div>
                        <button id="reauthorize-button" class="button button-secondary">Re-authorize</button>
                        <button id="new-token-button" class="button button-primary">New Store Token</button>
                    </div>
                </div>
                <hr style="height: 1px; background-color: #000;">
                <div id="spinner-overlay" style="display: none;">
                    <img id="spinner" src="<?php echo plugin_dir_url('sip-plugins-core/sip-plugins-core.php') . 'assets/images/spinner.webp'; ?>" alt="Loading...">

                </div>

                <?php if (empty($token)) : ?>
                    <h2>To Begin, We'll Need To Connect Your Printify Account.</h2>
                    <h2>This Will Load Your Store and Its Products Into the Manager. (You should only need to do this once!)</h2>
                    <form id="save-token-form" method="post" action="">
                        <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                        <h2>
                            <label for="printify_bearer_token">Printify API Token:</label>
                            <input type="text" name="printify_bearer_token" value="" class="regular-text" required/>
                            <input type="submit" name="save_token" value="Save Token" class="button button-primary"/>
                            <img id="spinner" src="<?php echo plugin_dir_url('sip-plugins-core/sip-plugins-core.php') . 'assets/images/spinner.webp'; ?>" style="display: none; width: 20px; height: 20px; vertical-align: middle; margin-left: 10px;">
                        </h2>
                        <hr style="height: 1px; background-color: #000;">
                    </form>

                <?php else : ?>
                    <?php if (!empty($shop_name)) : ?>
                        <h2 style="text-align: center; font-weight: bold; font-size: 32px;">
                            <a href="https://printify.com/app/store/products/1" target="_blank" style="color: inherit; text-decoration: none;">
                                <?php echo esc_html($shop_name); ?>
                            </a>
                        </h2>
                        <hr style="height: 1px; background-color: #000;">
                        <h2>Products</h2>
                        <form id="product-action-form" style="display: flex; align-items: center;" method="post" action="">
                            <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>

                            <label for="product_action">Product Actions: </label>
                            <select name="product_action" id="product_action">
                                <option value="reload">Reload</option>
                                <option value="create_template">Create Template</option>
                                <option value="remove_from_manager">Remove from Manager</option>
                            </select>
                            <input type="submit" name="execute_action" value="Execute" class="button button-secondary" style="margin-left: 10px;" />
                        </form>
                        <div id="product-list">
                            <?php 
                            $products = get_option('sip_printify_products');
                            if (!empty($products)) {
                                sip_display_product_list($products);
                            } else {
                                echo '<p>No products found.</p>';
                            }
                            ?>
                        </div>
                    <?php else : ?>
                        <h2>Shop could not be loaded. Please try re-authorizing.</h2>
                    <?php endif; ?>
                <?php endif; ?>

                <?php if (!empty($templates)) : ?>
                    <hr style="height: 1px; background-color: #000;">
                    <h2>Templates</h2>
                    <form id="template-action-form" method="post" action="">
                        <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>

                        <label for="template_action">Template Actions: </label>
                        <select name="template_action" id="template_action">
                            <option value="delete_template">Delete Template</option>
                            <option value="rename_template">Rename Template</option>
                            <option value="edit_template">Edit Template</option>
                        </select>
                        <input type="submit" name="execute_template_action" value="Execute" class="button button-secondary"/>
                        
                        <!-- Rename Template Input -->
                        <div id="rename-template-input" style="display: none; margin-top: 10px;">
                            <input type="text" name="new_template_name" placeholder="New template name">
                        </div>
                    </form>
                    <div id="template-list">
                        <?php 
                        sip_display_template_list($templates); 
                        ?>
                    </div>
                    <div id="template-editor" style="display: none; margin-top: 20px;">
                        <h3>Edit Template: <span id="editing-template-name"></span></h3>
                        <textarea id="template-content" rows="20" style="width: 100%;"></textarea>
                        <div style="margin-top: 10px;">
                            <button id="close-editor" class="button">Close</button>
                            <button id="revert-changes" class="button">Revert Changes</button>
                            <button id="save-template" class="button button-primary">Save Changes</button>
                        </div>
                    </div>
                <?php else : ?>
                    <h2>No templates found.</h2>
                <?php endif; ?>
        </div>
    </div>
    <?php
    }

    // Token Management Methods
    private static function save_token() {
        $token = sanitize_text_field($_POST['printify_bearer_token']);
        $shop_details = fetch_shop_details($token);
        if ($shop_details) {
            $encrypted_token = self::encrypt_token($token);
            update_option('printify_bearer_token', $encrypted_token);
            update_option('sip_printify_shop_name', $shop_details['shop_name']);
            update_option('sip_printify_shop_id', $shop_details['shop_id']);
            wp_send_json_success('Token saved and connection successful.');
        } else {
            wp_send_json_error('Invalid API token. Please check and try again.');
        }
    }

    private static function reauthorize() {
        $encrypted_token = get_option('printify_bearer_token');
        $token = self::decrypt_token($encrypted_token);
        $shop_details = fetch_shop_details($token);
        
        if ($shop_details) {
            update_option('sip_printify_shop_name', $shop_details['shop_name']);
            update_option('sip_printify_shop_id', $shop_details['shop_id']);
            wp_send_json_success('Reauthorized successfully.');
        } else {
            wp_send_json_error('Failed to reauthorize. Please check your API token.');
        }
    }

    private static function new_token() {
        delete_option('printify_bearer_token');
        delete_option('sip_printify_shop_name');
        delete_option('sip_printify_shop_id');
        delete_option('sip_printify_products');
        wp_send_json_success('New token setup initialized.');
    }

    // ===============================
    // Encryption & Decryption Methods
    // ===============================

    /**
     * Generate and store the encryption key if it doesn't already exist.
     *
     * This key is used to encrypt and decrypt sensitive information such as the bearer token.
     * It is automatically generated and stored securely in the WordPress options table.
     *
     * @return string The encryption key.
     */
    public static function generate_encryption_key() {
        // Check if the encryption key already exists
        $encryption_key = get_option('sip_printify_encryption_key');
        
        if (empty($encryption_key)) {
            // Generate a secure encryption key (32 bytes for AES-256)
            $encryption_key = base64_encode(random_bytes(32));
            update_option('sip_printify_encryption_key', $encryption_key);
        }

        return $encryption_key;
    }

    /**
     * Encrypt the bearer token before storing it.
     *
     * @param string $token The plain text bearer token.
     * @return string The encrypted token.
     */
    public static function encrypt_token($token) {
        // Get the encryption key from the options or generate one if it doesn't exist
        $encryption_key = self::generate_encryption_key();
        
        // Initialization Vector (IV) for AES encryption (16 bytes)
        $iv = substr(hash('sha256', '16_char_iv_here'), 0, 16);
        return openssl_encrypt($token, 'AES-256-CBC', base64_decode($encryption_key), 0, $iv);
    }

    /**
     * Decrypt the bearer token when retrieving it.
     *
     * @param string $encrypted_token The encrypted token.
     * @return string The plain text bearer token.
     */
    public static function decrypt_token($encrypted_token) {
        // Retrieve the encryption key
        $encryption_key = get_option('sip_printify_encryption_key');
        
        // Initialization Vector (IV) for AES decryption
        $iv = substr(hash('sha256', '16_char_iv_here'), 0, 16);
        return openssl_decrypt($encrypted_token, 'AES-256-CBC', base64_decode($encryption_key), 0, $iv);
    }


    // Product and Template Action Handlers
    private static function handle_product_action() {
        $product_action = sanitize_text_field($_POST['product_action']);
        $selected_products = isset($_POST['selected_products']) ? $_POST['selected_products'] : array();

        // Get the encrypted token and decrypt it
        $encrypted_token = get_option('printify_bearer_token');
        $token = self::decrypt_token($encrypted_token);
        $shop_id = get_option('sip_printify_shop_id');

        // Fetch and display products
        $updated_products = sip_execute_product_action($product_action, $selected_products);

        ob_start();
        sip_display_product_list($updated_products);
        $product_list_html = ob_get_clean();

        ob_start();
        $templates = sip_load_templates();
        sip_display_template_list($templates);
        $template_list_html = ob_get_clean();

        wp_send_json_success(array('product_list_html' => $product_list_html, 'template_list_html' => $template_list_html));
    }


    private static function handle_template_action() {
        $template_action = sanitize_text_field($_POST['template_action']);
        $selected_templates = isset($_POST['selected_templates']) ? $_POST['selected_templates'] : array();

        if ($template_action === 'delete_template') {
            foreach ($selected_templates as $template_name) {
                sip_delete_template(sanitize_text_field($template_name));
            }
        } elseif ($template_action === 'edit_template') {
            if (!empty($selected_templates)) {
                $template_name = sanitize_text_field($selected_templates[0]);
                $file_path = sip_get_template_dir() . $template_name . '.json';

                if (file_exists($file_path)) {
                    $template_content = file_get_contents($file_path);
                    wp_send_json_success(array(
                        'template_content' => $template_content,
                        'template_name' => $template_name
                    ));
                } else {
                    wp_send_json_error('Template file not found.');
                }
            } else {
                wp_send_json_error('No template selected.');
            }
        }

        $templates = sip_load_templates();
        ob_start();
        sip_display_template_list($templates);
        $template_list_html = ob_get_clean();
        wp_send_json_success(array('template_list_html' => $template_list_html));
    }

    private static function save_template() {
        $template_name = sanitize_text_field($_POST['template_name']);
        $template_content = wp_unslash($_POST['template_content']);
        $file_path = sip_get_template_dir() . $template_name . '.json';

        if (file_put_contents($file_path, $template_content)) {
            wp_send_json_success('Template saved successfully.');
        } else {
            wp_send_json_error('Failed to save template.');
        }
    }

    // Shortcode for displaying products
    public static function render_products_shortcode($atts) {
        $products = get_option('sip_printify_products');
        ob_start();
        if (!empty($products)) {
            sip_display_product_list($products);
        } else {
            echo '<p>No products found.</p>';
        }
        return ob_get_clean();
    }

    // Activation Hook
    public static function activate_plugin() {
        self::generate_encryption_key();
    }
}

// Initialize the Plugin
SiP_Printify_Manager::get_instance();
register_activation_hook(__FILE__, array('SiP_Printify_Manager', 'activate_plugin'));
SiP_Plugin_Framework::init_plugin(
    'SiP Printify Manager',
    __FILE__,
    'SiP_Printify_Manager'
);
