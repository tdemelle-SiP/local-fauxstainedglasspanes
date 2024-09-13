<?php
/*
Plugin Name: SiP Domain Mapper
Description: Maps specific domains to WordPress pages
Version: 1.7
Author: Stuff is Parts, LLC
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

require_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugin-framework.php');

class SiP_Domain_Mapper {
    private static $instance = null;
    private $options;

    private function __construct() {
        $this->options = get_option('sip_domain_mapper_options', array());
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_handle_mapping_action', array($this, 'handle_mapping_action'));
        add_action('template_redirect', array($this, 'check_domain_and_redirect'), 1);
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function render_admin_page() {
        $instance = self::get_instance();
        ?>
        <div class="wrap">
            <h1>Domain Mapper Settings</h1>
            <p>Map specific domains, subdomains, and paths to WordPress pages. When a visitor accesses your site using one of these mapped URLs, they will be automatically redirected to the corresponding page.</p>
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

    public function register_settings() {
        register_setting(
            'sip_domain_mapper_option_group',
            'sip_domain_mapper_options',
            array($this, 'sanitize_mappings')
        );

        add_settings_section(
            'sip_domain_mapper_setting_section',
            'URL to Page Mappings',
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

    public function sanitize_mappings($input) {
        $new_input = array();
        if (isset($input['mappings'])) {
            foreach ($input['mappings'] as $url => $page_id) {
                $sanitized_url = esc_url_raw($url);
                if (!empty($sanitized_url) && !empty($page_id)) {
                    $new_input['mappings'][$sanitized_url] = intval($page_id);
                }
            }
        }
        return $new_input;
    }

    public function section_info() {
        echo 'Add URL to page mappings below:';
    }

    public function mappings_callback() {
        $mappings = $this->get_mappings();
        ?>
        <div id="domain-mappings">
            <?php foreach ($mappings as $url => $page_id): ?>
            <div class="mapping">
                <input type="text" name="sip_domain_mapper_options[mappings][<?php echo esc_attr($url); ?>]" value="<?php echo esc_attr($url); ?>" placeholder="Domain, subdomain, or path" />
                <?php wp_dropdown_pages(array('name' => "sip_domain_mapper_options[mappings][{$url}]", 'selected' => $page_id, 'show_option_none' => 'Select a page')); ?>
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
        wp_enqueue_script('sip-domain-mapper-admin', plugin_dir_url(__FILE__) . 'assets/js/admin.js', array('jquery'), '1.1', true);
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

        $action = sanitize_text_field($_POST['mapping_action']);
        $url = isset($_POST['url']) ? esc_url_raw($_POST['url']) : '';
        $page_id = isset($_POST['page_id']) ? intval($_POST['page_id']) : 0;

        $mappings = $this->get_mappings();

        if ($action === 'add' || $action === 'update') {
            if (empty($url) || empty($page_id)) {
                wp_send_json_error('Invalid URL or page ID');
            }
            $mappings[$url] = $page_id;
        } elseif ($action === 'remove') {
            unset($mappings[$url]);
        } else {
            wp_send_json_error('Invalid action');
        }

        $this->options['mappings'] = $mappings;
        update_option('sip_domain_mapper_options', $this->options);

        wp_send_json_success($mappings);
    }

    public function check_domain_and_redirect() {
        $current_url = (is_ssl() ? 'https://' : 'http://') . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $mappings = $this->get_mappings();

        foreach ($mappings as $url => $page_id) {
            if ($this->url_matches($current_url, $url)) {
                $page_url = get_permalink($page_id);
                if ($page_url) {
                    wp_redirect($page_url);
                    exit;
                }
            }
        }
    }

    private function url_matches($current_url, $mapped_url) {
        $current_parts = parse_url($current_url);
        $mapped_parts = parse_url($mapped_url);

        // Check domain and subdomain
        if ($current_parts['host'] !== $mapped_parts['host']) {
            return false;
        }

        // Check path
        $current_path = isset($current_parts['path']) ? rtrim($current_parts['path'], '/') : '';
        $mapped_path = isset($mapped_parts['path']) ? rtrim($mapped_parts['path'], '/') : '';

        return $current_path === $mapped_path;
    }
}

SiP_Plugin_Framework::init_plugin(
    'SiP Domain Mapper',
    __FILE__,
    'SiP_Domain_Mapper'
);