<?php
/*
Plugin Name: SiP Domain Mapper
Description: Maps specific domains to WordPress pages
Version: 1.1
Author: Stuff is Parts, LLC
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

// Include the core file if it's not already included
if (!class_exists('SiP_Plugins_Core')) {
    include_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugins-core.php');
}

// Activation hook
register_activation_hook(__FILE__, 'sip_domain_mapper_activate');
function sip_domain_mapper_activate() {
    // Ensure the core is activated
    if (!class_exists('SiP_Plugins_Core')) {
        include_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugins-core.php');
    }
    sip_plugins_core()->activate();
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'sip_domain_mapper_deactivate');
function sip_domain_mapper_deactivate() {
    // Check if other SiP plugins are active before deactivating the core
    if (class_exists('SiP_Plugins_Core')) {
        sip_plugins_core()->maybe_deactivate();
    }
}

class SiP_Domain_Mapper {
    private static $instance = null;
    private $options;

    private function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
        $this->options = get_option('sip_domain_mapper_options', array());
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
                'SiP Domain Mapper',
                plugin_basename(__FILE__),
                array($this, 'render_admin_page')
            );
            // Add debug output
            add_action('admin_notices', function() {
                echo '<div class="notice notice-info"><p>SiP Domain Mapper registered with core.</p></div>';
            });
        } else {
            // Add debug output
            add_action('admin_notices', function() {
                echo '<div class="notice notice-error"><p>SiP Plugins Core not found or not functioning.</p></div>';
            });
        }
        add_action('admin_menu', array($this, 'add_plugin_page'));
        add_action('admin_init', array($this, 'page_init'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_handle_mapping_action', array($this, 'handle_mapping_action'));
        add_action('template_redirect', array($this, 'check_domain_and_redirect'), 1);
    }

    public function add_plugin_page() {
        add_submenu_page(
            'sip-plugins',
            'Domain Mapper Settings', 
            'Domain Mapper', 
            'manage_options', 
            'sip-domain-mapper', 
            array($this, 'render_admin_page')
        );
    }

    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>Domain Mapper Settings</h1>
            <p>Map specific domains to WordPress pages. When a visitor accesses your site using one of these mapped domains, they will be automatically redirected to the corresponding page.</p>
            <form method="post" action="options.php">
                <?php
                settings_fields('sip_domain_mapper_option_group');
                do_settings_sections('sip-domain-mapper');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    public function page_init() {
        register_setting(
            'sip_domain_mapper_option_group',
            'sip_domain_mapper_options',
            array($this, 'sanitize')
        );

        add_settings_section(
            'sip_domain_mapper_setting_section',
            'Domain to Page Mappings',
            array($this, 'section_info'),
            'sip-domain-mapper'
        );

        add_settings_field(
            'mappings',
            'Mappings',
            array($this, 'mappings_callback'),
            'sip-domain-mapper',
            'sip_domain_mapper_setting_section'
        );
    }

    public function sanitize($input) {
        $new_input = array();
        if (isset($input['mappings'])) {
            foreach ($input['mappings'] as $domain => $page_id) {
                if (!empty($domain) && !empty($page_id)) {
                    $new_input['mappings'][sanitize_text_field($domain)] = intval($page_id);
                }
            }
        }
        return $new_input;
    }

    public function section_info() {
        echo 'Add domain to page mappings below:';
    }

    public function mappings_callback() {
        $mappings = $this->get_mappings();
        ?>
        <div id="domain-mappings">
            <?php foreach ($mappings as $domain => $page_id): ?>
            <div class="mapping">
                <input type="text" name="sip_domain_mapper_options[mappings][<?php echo esc_attr($domain); ?>]" value="<?php echo esc_attr($domain); ?>" />
                <?php wp_dropdown_pages(array('name' => "sip_domain_mapper_options[mappings][{$domain}]", 'selected' => $page_id, 'show_option_none' => 'Select a page')); ?>
                <button type="button" class="remove-mapping button">Remove</button>
            </div>
            <?php endforeach; ?>
        </div>
        <button type="button" id="add-mapping" class="button button-secondary">Add New Mapping</button>
        <?php
    }

    public function get_mappings() {
        return isset($this->options['mappings']) ? $this->options['mappings'] : array();
    }

    public function enqueue_admin_scripts($hook) {
        if ('sip-plugins_page_sip-domain-mapper' !== $hook) {
            return;
        }
        wp_enqueue_script('sip-domain-mapper-admin', plugin_dir_url(__FILE__) . 'assets/js/admin.js', array('jquery'), '1.0', true);
        wp_localize_script('sip-domain-mapper-admin', 'sipDomainMapper', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('sip_domain_mapper_nonce')
        ));
    }

    public function handle_mapping_action() {
        check_ajax_referer('sip_domain_mapper_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Permission denied');
        }

        $action = $_POST['mapping_action'];
        $domain = isset($_POST['domain']) ? sanitize_text_field($_POST['domain']) : '';
        $page_id = isset($_POST['page_id']) ? intval($_POST['page_id']) : 0;

        $mappings = $this->get_mappings();

        if ($action === 'add' || $action === 'update') {
            $mappings[$domain] = $page_id;
        } elseif ($action === 'remove') {
            unset($mappings[$domain]);
        }

        $this->options['mappings'] = $mappings;
        update_option('sip_domain_mapper_options', $this->options);

        wp_send_json_success($mappings);
    }

    public function check_domain_and_redirect() {
        $current_domain = $_SERVER['HTTP_HOST'];
        $mappings = $this->get_mappings();

        if (isset($mappings[$current_domain])) {
            $page_id = $mappings[$current_domain];
            $page_url = get_permalink($page_id);
            if ($page_url) {
                wp_redirect($page_url);
                exit;
            }
        }
    }
}

function sip_domain_mapper() {
    return SiP_Domain_Mapper::get_instance();
}

// Initialize the plugin
add_action('plugins_loaded', 'sip_domain_mapper');