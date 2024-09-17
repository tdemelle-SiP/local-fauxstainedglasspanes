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
 *
 * **Plugin Options Index:**
 * 1. 'sip_printify_manager_options' - Stores multiple plugin settings collectively.
 * 2. 'printify_bearer_token' - Stores the Printify API token for authentication.
 * 3. 'sip_printify_shop_name' - Holds the name of the connected Printify shop.
 * 4. 'sip_printify_shop_id' - Contains the ID of the connected Printify shop.
 * 5. 'sip_printify_products' - Stores an array of products fetched from Printify.
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

        // ---------------------------------
        // Include Necessary Files
        // ---------------------------------
        require_once self::$plugin_dir . 'includes/shop-functions.php';
        require_once self::$plugin_dir . 'includes/product-functions.php';
        require_once self::$plugin_dir . 'includes/template-functions.php';

        // ---------------------------------
        // Set Up Actions and Filters
        // ---------------------------------
        // Enqueue admin-specific scripts and styles
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_admin_scripts'));
        
        // Enqueue frontend-specific scripts and styles
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_frontend_scripts'));
        
        // Handle AJAX requests
        add_action('wp_ajax_sip_handle_ajax_request', array(__CLASS__, 'handle_ajax_request'));
        
        // Register shortcode for displaying products
        add_shortcode('sip_printify_products', array(__CLASS__, 'render_products_shortcode'));
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

    // ===============================
    // 1. Initial API Connection
    // ===============================

    /**
     * Save API Token
     *
     * Saves the Printify API token after validating it by fetching shop details.
     *
     * **Options Involved:**
     * - 'printify_bearer_token'
     *   - **Description:**
     *     - Stores the Printify API token required for authenticating API requests to the Printify service.
     *     - Sensitive information that is encrypted and stored securely to prevent unauthorized access.
     *   - **Usage:**
     *     - **Saving Encrypted Token:**
     *         update_option('printify_bearer_token', $encrypted_token);
     *     - **Retrieving Encrypted Token:**
     *         $encrypted_token = get_option('printify_bearer_token');
     *     - **Deleting Token:**
     *         delete_option('printify_bearer_token');
     *
     * - 'sip_printify_shop_name'
     *   - **Description:**
     *     - Holds the name of the connected Printify shop.
     *     - Used to display the shop name within the plugin's admin interface.
     *   - **Usage:**
     *     - **Saving Shop Name:**
     *         update_option('sip_printify_shop_name', $shop_name);
     *     - **Retrieving Shop Name:**
     *         $shop_name = get_option('sip_printify_shop_name');
     *     - **Deleting Shop Name:**
     *         delete_option('sip_printify_shop_name');
     *
     * - 'sip_printify_shop_id'
     *   - **Description:**
     *     - Contains the ID of the connected Printify shop.
     *     - Used internally to reference the specific shop in API requests and other operations.
     *   - **Usage:**
     *     - **Saving Shop ID:**
     *         update_option('sip_printify_shop_id', $shop_id);
     *     - **Retrieving Shop ID:**
     *         $shop_id = get_option('sip_printify_shop_id');
     *     - **Deleting Shop ID:**
     *         delete_option('sip_printify_shop_id');
     */

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
    private static function encrypt_token($token) {
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
    private static function decrypt_token($encrypted_token) {
        // Retrieve the encryption key
        $encryption_key = get_option('sip_printify_encryption_key');
        
        // Initialization Vector (IV) for AES decryption
        $iv = substr(hash('sha256', '16_char_iv_here'), 0, 16);
        return openssl_decrypt($encrypted_token, 'AES-256-CBC', base64_decode($encryption_key), 0, $iv);
    }

    // ===============================
    // Token Management Methods
    // ===============================

    /**
     * Save API Token
     *
     * Saves the Printify API token after validating it by fetching shop details.
     * The token is encrypted before storage to ensure secure handling.
     */
    private static function save_token() {
        $token = sanitize_text_field($_POST['printify_bearer_token']);
        $shop_details = fetch_shop_details($token);
        if ($shop_details) {
            // Encrypt the token before saving it
            $encrypted_token = self::encrypt_token($token);
            update_option('printify_bearer_token', $encrypted_token);
            
            // Save the shop details
            $shop_name = $shop_details['shop_name'];
            $shop_id = $shop_details['shop_id'];
            update_option('sip_printify_shop_name', $shop_name);
            update_option('sip_printify_shop_id', $shop_id);
            wp_send_json_success('Token saved and connection successful.');
        } else {
            wp_send_json_error('Invalid API token. Please check and try again.');
        }
    }

    /**
     * Reauthorize API Connection
     *
     * Revalidates the existing API token by fetching shop details.
     * The token is decrypted for use during this process.
     *
     * **Options Involved:**
     * - 'sip_printify_shop_name'
     * - 'sip_printify_shop_id'
     *
     * **Usage:**
     * - **Retrieving Shop Details:**
     *     $shop_name = get_option('sip_printify_shop_name');
     *     $shop_id = get_option('sip_printify_shop_id');
     * - **Updating Shop Details:**
     *     update_option('sip_printify_shop_name', $shop_name);
     *     update_option('sip_printify_shop_id', $shop_id);
     */
    private static function reauthorize() {
        $encrypted_token = get_option('printify_bearer_token');
        
        // Decrypt the token after retrieving it
        $token = self::decrypt_token($encrypted_token);
        $shop_details = fetch_shop_details($token);
        
        if ($shop_details) {
            $shop_name = $shop_details['shop_name'];
            $shop_id = $shop_details['shop_id'];
            update_option('sip_printify_shop_name', $shop_name);
            update_option('sip_printify_shop_id', $shop_id);
            wp_send_json_success('Reauthorized successfully.');
        } else {
            wp_send_json_error('Failed to reauthorize. Please check your API token.');
        }
    }

    /**
     * Initialize New API Token Setup
     *
     * Clears existing API token, shop details, and associated products to allow setting up a new token.
     * The encrypted token is deleted, along with the associated shop details and products, since products
     * are tied to the shop.
     *
     * **Options Involved:**
     * - 'printify_bearer_token'
     * - 'sip_printify_shop_name'
     * - 'sip_printify_shop_id'
     * - 'sip_printify_products'
     *
     * **Usage:**
     * - **Deleting Token, Shop Details, and Products:**
     *     delete_option('printify_bearer_token');
     *     delete_option('sip_printify_shop_name');
     *     delete_option('sip_printify_shop_id');
     *     delete_option('sip_printify_products');
     */
    private static function new_token() {
        delete_option('printify_bearer_token');
        delete_option('sip_printify_shop_name');
        delete_option('sip_printify_shop_id');
        delete_option('sip_printify_products'); // Clear products tied to the shop
        wp_send_json_success('New token setup initialized.');
    }


    // ===============================
    // Activation Hook
    // Generate the encryption key upon plugin activation.
    // ===============================

    /**
     * Activation Hook
     *
     * Generates the encryption key upon plugin activation to ensure secure handling of sensitive data.
     */
    public static function activate_plugin() {
        self::generate_encryption_key();
    }

    // ===============================
    // 2. Store Management
    // ===============================

    // (Note: Store management primarily involves handling shop details, which are managed in API Connection)

    // ===============================
    // 3. Product Management
    // ===============================

    /**
     * Handle Product Actions
     *
     * Executes actions on selected products based on user input.
     *
     * **Option Involved:**
     * - 'sip_printify_products'
     *   - **Description:**
     *     - Stores an array of products fetched from the Printify shop.
     *     - Utilized to display, manage, and perform actions on products within the plugin's admin interface.
     *   - **Usage:**
     *     - **Saving Products:**
     *         update_option('sip_printify_products', $products);
     *     - **Retrieving Products:**
     *         $products = get_option('sip_printify_products');
     *     - **Displaying Products:**
     *         sip_display_product_list($products);
     */
    private static function handle_product_action() {
        // Sanitize the action type and selected products
        $product_action = sanitize_text_field($_POST['product_action']);
        $selected_products = isset($_POST['selected_products']) ? $_POST['selected_products'] : array();

        // Ensure $selected_products is an array
        if (!is_array($selected_products)) {
            $selected_products = array($selected_products);
        }

        // Sanitize each product ID
        $selected_products = array_map('sanitize_text_field', $selected_products);

        // Execute the selected product action
        $updated_products = sip_execute_product_action($product_action, $selected_products);

        // Prepare the updated product list HTML
        ob_start();
        sip_display_product_list($updated_products);
        $product_list_html = ob_get_clean();

        // Prepare the updated template list HTML
        ob_start();
        $templates = sip_load_templates();
        sip_display_template_list($templates);
        $template_list_html = ob_get_clean();

        // Send a success response with updated HTML
        wp_send_json_success(array('product_list_html' => $product_list_html, 'template_list_html' => $template_list_html));
    }

    // ===============================
    // 4. Template Management
    // ===============================

    /**
     * Handle Template Actions
     *
     * Executes actions on selected templates based on user input.
     */
    private static function handle_template_action() {
        // Sanitize the action type and selected templates
        $template_action = sanitize_text_field($_POST['template_action']);
        $selected_templates = isset($_POST['selected_templates']) ? $_POST['selected_templates'] : array();

        if ($template_action === 'delete_template') {
            if (!empty($selected_templates)) {
                foreach ($selected_templates as $template_name) {
                    // Sanitize each template name before deletion
                    $template_name = sanitize_text_field($template_name);
                    $result = sip_delete_template($template_name);
                }
            }
        } elseif ($template_action === 'edit_template') {
            if (!empty($selected_templates)) {
                // Only allow editing one template at a time
                $template_name = sanitize_text_field($selected_templates[0]);
                $template_dir = sip_get_template_dir();
                $file_path = $template_dir . $template_name . '.json';

                if (file_exists($file_path)) {
                    // Retrieve the template content for editing
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

        // Reload the template list after action
        $templates = sip_load_templates();
        ob_start();
        sip_display_template_list($templates);
        $template_list_html = ob_get_clean();

        // Send a success response with updated template list
        wp_send_json_success(array('template_list_html' => $template_list_html));
    }

    /**
     * Save Edited Template
     *
     * Saves changes made to a template.
     */
    private static function save_template() {
        // Sanitize the template name and content
        $template_name = sanitize_text_field($_POST['template_name']);
        $template_content = wp_unslash($_POST['template_content']);
        $template_dir = sip_get_template_dir();
        $file_path = $template_dir . $template_name . '.json';

        // Attempt to write the updated content to the template file
        if (file_put_contents($file_path, $template_content)) {
            wp_send_json_success('Template saved successfully.');
        } else {
            wp_send_json_error('Failed to save template.');
        }
    }

    // ===============================
    // 5. New Product Creation Management
    // ===============================

    // (Note: New Product Creation may involve creating products via templates or API actions, handled in product and template management)

    /**
     * Handle AJAX Requests
     *
     * Processes AJAX requests and routes them to the appropriate handler based on action type.
     */
    public static function handle_ajax_request() {
        // Verify the AJAX nonce for security
        check_ajax_referer('sip_printify_manager_nonce', 'nonce');

        // Sanitize the action type
        $action_type = sanitize_text_field($_POST['action_type']);

        // Route the request to the appropriate handler
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
                // Send an error response for invalid actions
                wp_send_json_error('Invalid action.');
                break;
        }
    }

    /**
     * Enqueue Admin Scripts and Styles
     *
     * Loads necessary CSS and JavaScript files for the admin interface.
     *
     * @param string $hook The current admin page.
     */
    public static function enqueue_admin_scripts($hook) {
        // Enqueue Dashicons for icon support
        wp_enqueue_style('dashicons');
        
        // Enqueue plugin-specific CSS
        wp_enqueue_style('sip-printify-manager-style', plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager.css');
        
        // Enqueue plugin-specific JavaScript
        wp_enqueue_script('sip-printify-manager-script', plugin_dir_url(__FILE__) . 'assets/js/sip-printify-manager.js', array('jquery'), null, true);
        
        // Enqueue AJAX handling script
        wp_enqueue_script('sip-ajax-script', plugin_dir_url(__FILE__) . 'assets/js/sip-ajax.js', array('jquery'), null, true);
        
        // Localize script to pass AJAX URL and nonce to JavaScript
        wp_localize_script('sip-ajax-script', 'sipAjax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('sip_printify_manager_nonce')
        ));
    }

    /**
     * Enqueue Frontend Scripts and Styles
     *
     * Loads necessary CSS and JavaScript files for the frontend interface.
     */
    public static function enqueue_frontend_scripts() {
        // Enqueue frontend-specific CSS
        wp_enqueue_style('sip-printify-manager-frontend', plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager-frontend.css');
        
        // Enqueue frontend-specific JavaScript
        wp_enqueue_script('sip-printify-manager-frontend', plugin_dir_url(__FILE__) . 'assets/js/sip-printify-manager-frontend.js', array('jquery'), null, true);
    }

    /**
     * Render Products Shortcode
     *
     * Outputs the list of products when the [sip_printify_products] shortcode is used.
     *
     * @param array $atts Shortcode attributes.
     * @return string HTML content to display.
     */
    public static function render_products_shortcode($atts) {
        // Retrieve products from the database
        $products = get_option('sip_printify_products');
        ob_start();
        if (!empty($products)) {
            // Display the list of products
            sip_display_product_list($products);
        } else {
            // Show a message if no products are found
            echo '<p>No products found.</p>';
        }
        return ob_get_clean();
    }

    // ===============================
    // Admin Page Rendering
    // ===============================

    /**
     * Render Admin Page
     *
     * Outputs the HTML content for the plugin's admin page, including API connection setup,
     * shop details, product and template management interfaces.
     */
    public static function render_admin_page() {
        // Retrieve necessary options from the database
        $token = get_option('printify_bearer_token');
        $shop_name = get_option('sip_printify_shop_name');
        $products = get_option('sip_printify_products');
        $templates = sip_load_templates();

        ?>
        <div class="wrap">
            <h1>Weclome to SIP Printify Manager!</h1>
            <hr style="height: 1px; background-color: #000;">
            <?php if (empty($token)) : ?>
                <!-- Initial API Connection UI -->
                <h2>To Begin, We'll Need To Connect Your Printify Account.</h2>
                <h2>This Will Load Your Store and Its Products Into the Manager. (You should only need to do this once!)</h2>
                <ol>
                    <li>
                        Log in to your Printify account and navigate to the <a href="https://printify.com/app/account/api" target="_blank">Connections</a> page.
                    </li>
                    <li>
                        Provide a contact email in the "API Access" section where you would like to receive connection related notifications.
                    </li>
                    <li>
                        Click the <strong>Generate</strong> button to create a new API token.
                    </li>
                    <li>
                        Name your token (e.g., "Printify Manager Token") and select :All scopes (full access).
                    </li>
                    <li>
                        Click <strong>Generate token</strong> and then Click <strong>Copy to clipboard</strong>.
                    </li>
                    <li>
                        Paste the token below and click <strong>Save Token</strong>.
                    </li>
                </ol>
                <p><strong>Note:</strong> It's a good idea to save the token somewhere you can access it later in case you need to re-authorize the plugin. If you lose the token, don't worry, you can just follow these steps again to generate a new one.</p>
                <form id="save-token-form" method="post" action="">
                    <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>

                    <h2>
                        <label for="printify_bearer_token">Printify API Token:</label>
                        <input type="text" name="printify_bearer_token" value="" class="regular-text" required/>
                        <input type="submit" name="save_token" value="Save Token" class="button button-primary"/>
                        <!-- Spinner added next to the button, initially hidden -->
                        <img id="spinner" src="<?php echo plugin_dir_url('sip-plugins-core/sip-plugins-core.php') . 'assets/images/spinner.webp'; ?>" style="display: none; width: 20px; height: 20px; vertical-align: middle; margin-left: 10px;">

                    </h2>
                    <hr style="height: 1px; background-color: #000;">
                </form>

            <?php else : ?>
                <!-- Authorized State UI -->
                <h2>Authorized</h2>
                <form id="authorization-form" method="post" action="">
                    <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>

                    <input type="submit" name="reauthorize" value="Re-authorize" class="button button-secondary"/>
                    <input type="submit" name="new_token" value="New Token" class="button button-primary"/>
                </form>

                <?php if (!empty($shop_name)) : ?>
                    <!-- Store Management UI -->
                    <h2>Shop: <a href="https://printify.com/app/store/products/1" target="_blank"><?php echo esc_html($shop_name); ?></a></h2>
                    
                    <!-- Product Management UI -->
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
                        
                        <!-- Loading Spinner -->
                        <div id="loading-spinner" style="display: none; margin-left: 10px;">
                            <img src="<?php echo plugin_dir_url('sip-plugins-core/sip-plugins-core.php'); ?>assets/images/spinner.webp" alt="Loading..." width="24" height="24"/>
                        </div>
                    </form>
                    <div id="product-list">
                        <?php 
                        // Display the list of products or a message if no products are found
                        $products = get_option('sip_printify_products');
                        if (!empty($products)) {
                            sip_display_product_list($products);
                        } else {
                            echo '<p>No products found.</p>';
                        }
                        ?>
                    </div>
                        
                <?php else : ?>
                    <!-- Error State for Store Loading -->
                    <h2>Shop could not be loaded. Please try re-authorizing.</h2>
                <?php endif; ?>
            <?php endif; ?>

            <?php if (!empty($templates)) : ?>
                <!-- Template Management UI -->
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
                    // Display the list of templates
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
                <!-- No Templates Found Message -->
                <h2>No templates found.</h2>
            <?php endif; ?>
        </div>
        <?php
    }
}

// ===============================
// Initialize the Plugin
// ===============================

// Instantiate the main plugin class
SiP_Printify_Manager::get_instance();

// Hook for generating the encryption key on plugin activation
register_activation_hook(__FILE__, array('SiP_Printify_Manager', 'activate_plugin'));

// Initialize the plugin framework to add the admin submenu and handle activation dependencies
SiP_Plugin_Framework::init_plugin(
    'SiP Printify Manager',       // Plugin display name
    __FILE__,                     // Main plugin file path
    'SiP_Printify_Manager'       // Class name responsible for rendering the admin page
);
