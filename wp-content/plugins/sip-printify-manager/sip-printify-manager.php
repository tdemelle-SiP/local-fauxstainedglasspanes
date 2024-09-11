<?php
/*
Plugin Name: SiP Printify Manager
Description: A plugin to help manage your Printify Shop and its Products
Version: 1.0
Author: Todd DeMelle
*/

if (!defined('ABSPATH')) {
    exit;
}

// Include the core file if it's not already included
if (!class_exists('SiP_Plugins_Core')) {
    include_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugins-core.php');
}

// Activation hook
register_activation_hook(__FILE__, 'sip_printify_manager_activate');
function sip_printify_manager_activate() {
    // Ensure the core is activated
    if (!class_exists('SiP_Plugins_Core')) {
        include_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugins-core.php');
    }
    sip_plugins_core()->activate();
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'sip_printify_manager_deactivate');
function sip_printify_manager_deactivate() {
    // Check if other SiP plugins are active before deactivating the core
    if (class_exists('SiP_Plugins_Core')) {
        sip_plugins_core()->maybe_deactivate();
    }
}

// Include necessary files
require_once plugin_dir_path(__FILE__) . 'includes/shop-functions.php';
require_once plugin_dir_path(__FILE__) . 'includes/product-functions.php';
require_once plugin_dir_path(__FILE__) . 'includes/template-functions.php';

class SiP_Printify_Manager {
    private static $instance = null;
    private $options;

    private function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function init() {
        if (function_exists('sip_plugins_core')) {
            sip_plugins_core()->register_plugin(
                'SiP Printify Manager',
                plugin_basename(__FILE__),
                array($this, 'render_admin_page')
            );
            // Add debug output
            add_action('admin_notices', function() {
                echo '<div class="notice notice-info"><p>SiP Printify Manager registered with core.</p></div>';
            });
        } else {
            // Add debug output
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>SiP Plugins Core not found or not functioning.</p></div>';
            });
        }
        add_action('admin_menu', array($this, 'add_plugin_page'));
#        add_action('admin_menu', array($this, 'add_submenu_page'));
        add_action('wp_ajax_sip_handle_ajax_request', array($this, 'handle_ajax_request'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }

    public function add_submenu_page() {
        add_submenu_page(
            'sip-plugins',
            'Printify Manager',
            'Printify Manager',
            'manage_options',
            'sip-printify-manager',
            array($this, 'render_admin_page')
        );
    }

    public function render_admin_page() {
        $token = get_option('printify_bearer_token');
        $shop_name = get_option('sip_printify_shop_name');
        $products = get_option('sip_printify_products');
        $templates = sip_load_templates();

        include plugin_dir_path(__FILE__) . 'views/admin-page.php';
    }

    public function handle_ajax_request() {
        check_ajax_referer('sip-ajax-nonce', 'nonce');

        $action_type = sanitize_text_field($_POST['action_type']);

        switch ($action_type) {
            case 'save_token':
                $token = sanitize_text_field($_POST['printify_bearer_token']);
                update_option('printify_bearer_token', $token);
                wp_send_json_success('Token saved successfully.');
                break;

            case 'reauthorize':
                sip_connect_shop();
                wp_send_json_success('Reauthorized successfully.');
                break;

            case 'new_token':
                delete_option('printify_bearer_token');
                delete_option('sip_printify_shop_name');
                delete_option('sip_printify_shop_id');
                wp_send_json_success('New token setup initialized.');
                break;

            case 'product_action':
                $product_action = sanitize_text_field($_POST['product_action']);
                $selected_products = isset($_POST['selected_products']) ? $_POST['selected_products'] : array();
                
                if (!is_array($selected_products)) {
                    $selected_products = array($selected_products);
                }
                
                $selected_products = array_map('sanitize_text_field', $selected_products);
                
                $updated_products = sip_execute_product_action($product_action, $selected_products);

                ob_start();
                sip_display_product_list($updated_products);
                $product_list_html = ob_get_clean();

                ob_start();
                $templates = sip_load_templates();
                sip_display_template_list($templates);
                $template_list_html = ob_get_clean();

                wp_send_json_success(array('product_list_html' => $product_list_html, 'template_list_html' => $template_list_html));
                break;

            case 'template_action':
                $template_action = sanitize_text_field($_POST['template_action']);
                $selected_templates = isset($_POST['selected_templates']) ? $_POST['selected_templates'] : array();

                if ($template_action === 'delete_template') {
                    if (!empty($selected_templates)) {
                        foreach ($selected_templates as $template_name) {
                            sip_delete_template($template_name);
                        }
                    }
                } elseif ($template_action === 'edit_template') {
                    if (!empty($selected_templates)) {
                        $template_name = $selected_templates[0];
                        $template_dir = sip_get_template_dir();
                        $file_path = $template_dir . $template_name . '.json';
                
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
                break;

            case 'save_template':
                $template_name = sanitize_text_field($_POST['template_name']);
                $template_content = wp_unslash($_POST['template_content']);
                $template_dir = sip_get_template_dir();
                $file_path = $template_dir . $template_name . '.json';

                if (file_put_contents($file_path, $template_content)) {
                    wp_send_json_success('Template saved successfully.');
                } else {
                    wp_send_json_error('Failed to save template.');
                }
                break;

            default:
                wp_send_json_error('Invalid action.');
                break;
        }
    }

    public function enqueue_admin_scripts($hook) {
        if ('sip-plugins_page_sip-printify-manager' !== $hook) {
            return;
        }
        wp_enqueue_style('sip-printify-manager-style', plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager.css');
        wp_enqueue_script('sip-printify-manager-script', plugin_dir_url(__FILE__) . 'assets/js/sip-printify-manager.js', array('jquery'), null, true);
        wp_localize_script('sip-printify-manager-script', 'sipAjax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('sip-ajax-nonce')
        ));
    }
}

function sip_printify_manager() {
    return SiP_Printify_Manager::get_instance();
}

// Initialize the plugin
add_action('plugins_loaded', 'sip_printify_manager');