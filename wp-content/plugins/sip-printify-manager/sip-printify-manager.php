<?php
/*
Plugin Name: SiP Printify Manager
Description: A plugin to help manage your Printify Shop and its Products
Version: 1.6
Author: Todd DeMelle
*/

if (!defined('ABSPATH')) exit;

require_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugin-framework.php');

class SiP_Printify_Manager {
    private static $instance = null;
    private $options;

    private function __construct() {
        $this->options = get_option('sip_printify_manager_options', array());
        add_action('wp_ajax_sip_handle_printify_ajax_request', array($this, 'handle_ajax_request'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
        add_shortcode('sip_printify_products', array($this, 'render_products_shortcode'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function render_admin_page() {
        echo '<div class="wrap">';
        echo '<h1>SiP Printify Manager</h1>';
        echo '<p>Manage your Printify integration here.</p>';
        // Add your Printify management interface here
        echo '</div>';
    }

    public function handle_ajax_request() {
        check_ajax_referer('sip-printify-ajax-nonce', 'nonce');

        $action_type = sanitize_text_field($_POST['action_type']);

        switch ($action_type) {
            case 'save_token':
                $this->save_token();
                break;
            case 'reauthorize':
                $this->reauthorize();
                break;
            case 'product_action':
                $this->handle_product_action();
                break;
            case 'template_action':
                $this->handle_template_action();
                break;
            default:
                wp_send_json_error('Invalid action.');
                break;
        }
    }

    private function save_token() {
        $token = sanitize_text_field($_POST['printify_bearer_token']);
        update_option('printify_bearer_token', $token);
        wp_send_json_success('Token saved successfully.');
    }

    private function reauthorize() {
        // Implement reauthorization logic
        wp_send_json_success('Reauthorized successfully.');
    }

    private function handle_product_action() {
        $product_action = sanitize_text_field($_POST['product_action']);
        $selected_products = isset($_POST['selected_products']) ? array_map('sanitize_text_field', $_POST['selected_products']) : array();
        
        // Implement product action logic
        $updated_products = array(); // This should be populated with actual data
        
        ob_start();
        $this->display_product_list($updated_products);
        $product_list_html = ob_get_clean();

        wp_send_json_success(array('product_list_html' => $product_list_html));
    }

    private function handle_template_action() {
        $template_action = sanitize_text_field($_POST['template_action']);
        $selected_templates = isset($_POST['selected_templates']) ? array_map('sanitize_text_field', $_POST['selected_templates']) : array();

        // Implement template action logic
        $templates = array(); // This should be populated with actual data

        ob_start();
        $this->display_template_list($templates);
        $template_list_html = ob_get_clean();

        wp_send_json_success(array('template_list_html' => $template_list_html));
    }

    public function enqueue_admin_scripts($hook) {
        if ('sip-plugins_page_sip-printify-manager' !== $hook) {
            return;
        }
        wp_enqueue_style('sip-printify-manager-style', plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager.css');
        wp_enqueue_script('sip-printify-manager-script', plugin_dir_url(__FILE__) . 'assets/js/sip-printify-manager.js', array('jquery'), null, true);
        wp_localize_script('sip-printify-manager-script', 'sipPrintifyAjax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('sip-printify-ajax-nonce')
        ));
    }

    public function enqueue_frontend_scripts() {
        wp_enqueue_style('sip-printify-manager-frontend', plugin_dir_url(__FILE__) . 'assets/css/sip-printify-manager-frontend.css');
        wp_enqueue_script('sip-printify-manager-frontend', plugin_dir_url(__FILE__) . 'assets/js/sip-printify-manager-frontend.js', array('jquery'), null, true);
    }

    public function render_products_shortcode($atts) {
        // Implement shortcode logic to display Printify products
        $products = $this->get_printify_products();
        ob_start();
        include plugin_dir_path(__FILE__) . 'views/products-shortcode.php';
        return ob_get_clean();
    }

    private function get_printify_products() {
        // Implement logic to fetch Printify products
        return array(); // This should return actual product data
    }

    private function display_product_list($products) {
        // Implement logic to display product list
        include plugin_dir_path(__FILE__) . 'views/product-list.php';
    }

    private function display_template_list($templates) {
        // Implement logic to display template list
        include plugin_dir_path(__FILE__) . 'views/template-list.php';
    }
}

SiP_Plugin_Framework::init_plugin(
    'SiP Printify Manager',
    __FILE__,
    'SiP_Printify_Manager'
);