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

require_once plugin_dir_path(__FILE__) . 'includes/shop-functions.php';
require_once plugin_dir_path(__FILE__) . 'includes/product-functions.php';
require_once plugin_dir_path(__FILE__) . 'includes/template-functions.php';

function sip_handle_ajax_request() {
    check_ajax_referer('sip-ajax-nonce', 'nonce');

    $action_type = sanitize_text_field($_POST['action_type']);

    switch ($action_type) {
        case 'save_token':
            $token = sanitize_text_field($_POST['printify_bearer_token']);
            update_option('printify_bearer_token', $token);
            wp_send_json_success('Token saved successfully.');
            break;

        case 'reauthorize':
            $token = get_option('printify_bearer_token');
            $shop_details = fetch_shop_details($token);
            if ($shop_details) {
                $shop_name = $shop_details['shop_name'];
                $shop_id = $shop_details['shop_id'];
                update_option('sip_printify_shop_name', $shop_name);
                update_option('sip_printify_shop_id', $shop_id);
            }
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
            error_log('Product action: ' . $product_action);
    
            // Ensure $selected_products is an array
            if (!is_array($selected_products)) {
                $selected_products = array($selected_products);
            }
    
            // Sanitize each product ID
            $selected_products = array_map('sanitize_text_field', $selected_products);
    
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

            wp_send_json_success(array('product_list_html' => $product_list_html, 'template_list_html' => $template_list_html));
            break;

        case 'template_action':
            $template_action = sanitize_text_field($_POST['template_action']);
            $selected_templates = isset($_POST['selected_templates']) ? $_POST['selected_templates'] : array();

            error_log('Template action: ' . $template_action);
            error_log('Selected templates: ' . print_r($selected_templates, true));

            if ($template_action === 'delete_template') {
                if (!empty($selected_templates)) {
                    foreach ($selected_templates as $template_name) {
                        $result = sip_delete_template($template_name);
                        error_log('Attempt to delete template ' . $template_name . ': ' . ($result ? 'Success' : 'Failed'));
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

            // Reload the template list
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

add_action('wp_ajax_sip_handle_ajax_request', 'sip_handle_ajax_request');

function sip_printify_manager_menu() {
    add_menu_page(
        'SIP Printify Manager',
        'Printify Manager',
        'manage_options',
        'sip-printify-manager',
        'sip_printify_manager_page',
        'dashicons-admin-generic',
        90
    );
}
add_action('admin_menu', 'sip_printify_manager_menu');

function sip_printify_manager_page() {
    $token = get_option('printify_bearer_token');
    $shop_name = get_option('sip_printify_shop_name');
    $products = get_option('sip_printify_products');
    $templates = sip_load_templates();

    ?>
    <div class="wrap">
        <h1>SIP Printify Manager</h1>

        <?php if (empty($token)) : ?>
            <h2>API Token</h2>
            <form id="save-token-form">
                <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
                <label for="printify_bearer_token">Printify Bearer Token:</label>
                <input type="text" name="printify_bearer_token" value="" class="regular-text" required/>
                <input type="submit" name="save_token" value="Save Token" class="button button-primary"/>
            </form>
        <?php else : ?>
            <h2>Authorized</h2>
            <form id="authorization-form">
                <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
                <input type="submit" name="reauthorize" value="Re-authorize" class="button button-secondary"/>
                <input type="submit" name="new_token" value="New Token" class="button button-primary"/>
            </form>

            <?php if (!empty($shop_name)) : ?>
                <h2>Shop: <?php echo esc_html($shop_name); ?></h2>
                <h2>Products</h2>
                <form id="product-action-form" style="display: flex; align-items: center;">
                    <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
                    <label for="product_action">Product Actions: </label>
                    <select name="product_action" id="product_action">
                        <option value="reload">Reload</option>
                        <option value="create_template">Create Template</option>
                        <option value="remove_from_manager">Remove from Manager</option>
                    </select>
                    <input type="submit" name="execute_action" value="Execute" class="button button-secondary" style="margin-left: 10px;" />
                    
                    <!-- Spinner -->
                    <div id="loading-spinner" style="display: none; margin-left: 10px;">
                        <img src="<?php echo plugin_dir_url(__FILE__); ?>/assets/images/spinner.webp" alt="Loading..." width="24" height="24"/>
                    </div>
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
            <h2>Templates</h2>
            <form id="template-action-form">
                <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
                <label for="template_action">Template Actions: </label>
                <select name="template_action" id="template_action">
                    <option value="delete_template">Delete Template</option>
                    <option value="rename_template">Rename Template</option>
                    <option value="edit_template">Edit Template</option>
                </select>
                <input type="submit" name="execute_template_action" value="Execute" class="button button-secondary"/>
                <div id="rename-template-input" style="display: none; margin-top: 10px;">
                    <input type="text" name="new_template_name" placeholder="New template name">
                </div>
            </form>
            <div id="template-list">
                <?php sip_display_template_list($templates); ?>
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
    <?php
}

function sip_printify_manager_scripts() {
    wp_enqueue_style('sip-printify-manager-style', plugin_dir_url(__FILE__) . 'css/sip-printify-manager.css');
    wp_enqueue_script('sip-printify-manager-script', plugin_dir_url(__FILE__) . 'js/sip-printify-manager.js', array('jquery'), null, true);
    wp_enqueue_script('sip-ajax-script', plugin_dir_url(__FILE__) . 'js/sip-ajax.js', array('jquery'), null, true);
    wp_localize_script('sip-ajax-script', 'sipAjax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('sip-ajax-nonce')
    ));
}

add_action('admin_enqueue_scripts', 'sip_printify_manager_scripts');