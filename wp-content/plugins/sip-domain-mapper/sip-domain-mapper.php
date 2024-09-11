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

// Register this plugin with the core
add_action('plugins_loaded', function() {
    if (function_exists('sip_plugins_core')) {
        sip_plugins_core()->register_plugin('SiP Domain Mapper', plugin_basename(__FILE__));
    }
});

// Include the settings file
require_once plugin_dir_path(__FILE__) . 'domain-mapper-settings.php';

class SiP_Domain_Mapper {
    private static $instance = null;
    private $settings;

    private function __construct() {
        $this->settings = new SiP_Domain_Mapper_Settings();
        add_action('template_redirect', array($this, 'check_domain_and_redirect'), 1);
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function check_domain_and_redirect() {
        $current_domain = $_SERVER['HTTP_HOST'];
        $mappings = $this->settings->get_mappings();

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

// Register this plugin with the core
add_action('plugins_loaded', function() {
    if (function_exists('sip_plugins_core')) {
        sip_plugins_core()->register_plugin('SiP Domain Mapper', plugin_basename(__FILE__));
    }
});


class SIPDomainMapper {
    private $options;

	public function __construct() {
    	add_action('admin_menu', array($this, 'add_plugin_page'));
    	add_action('admin_init', array($this, 'page_init'));
    	add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    	add_action('template_redirect', array($this, 'check_domain_and_redirect'), 1);
    	add_action('wp_ajax_handle_mapping_action', array($this, 'handle_mapping_action'));
    	$this->options = get_option('sip_domain_mapper_options');
	}

    public function add_plugin_page() {
        if (!menu_page_exists('stuff-is-parts')) {
            add_menu_page(
                'Stuff is Parts', 
                'Stuff is Parts', 
                'manage_options', 
                'stuff-is-parts', 
                array($this, 'create_sip_main_page'),
                plugins_url('sip-domain-mapper/assets/images/SiP-Logo-24px.svg', dirname(__FILE__)),
                30
            );
        }

        add_submenu_page(
            'stuff-is-parts',
            'Domain Mapper', 
            'Domain Mapper', 
            'manage_options', 
            'sip-domain-mapper', 
            array($this, 'create_admin_page')
        );
    }

    public function create_sip_main_page() {
        ?>
        <div class="wrap">
            <h1>Stuff is Parts Tools</h1>
            <p>Welcome to the Stuff is Parts tools dashboard. Select a tool from the submenu to get started.</p>
        </div>
        <?php
    }

    public function create_admin_page() {
        ?>
        <div class="wrap">
            <?php 
        	if (defined('WP_DEBUG') && WP_DEBUG) {
            	echo '<div class="debug-info">';
            	$this->debug_print_mappings();
            	echo '</div>';
        	}
        	?>
            <h1>Domain Mapper Settings</h1>
            <p>Use this tool to map specific domains to WordPress pages. When a visitor accesses your site using one of these mapped domains, they will be automatically redirected to the corresponding page.</p>
            <div id="sip-domain-mapper-form">
                <h2>Add New Mapping</h2>
                <div class="form-fields">
                    <input type="text" id="new-domain" placeholder="Enter domain (e.g., example.com)" />
                    <select id="new-page">
                        <option value="">Select a page</option>
                        <?php
                        $pages = get_pages();
                        foreach ($pages as $page) {
                            echo '<option value="' . $page->ID . '">' . esc_html($page->post_title) . '</option>';
                        }
                        ?>
                    </select>
                    <button type="button" id="add-mapping" class="button button-primary">Add Mapping</button>
                </div>
            </div>
            <div id="active-mappings">
                <h2>Active Mappings</h2>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Page</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Active mappings will be inserted here by JavaScript -->
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }

    // Add this new method to handle AJAX requests
    public function handle_mapping_action() {
        error_log('handle_mapping_action called');
    	error_log('Action: ' . $action);
		error_log('Current mappings: ' . print_r($mappings, true));
        
        if (!check_ajax_referer('sip_domain_mapper_nonce', 'nonce', false)) {
            error_log('Nonce check failed');
            wp_send_json_error(array('message' => 'Security check failed'));
            return;
        }
        
        if (!isset($_POST['mapping_action'])) {
            error_log('mapping_action not set');
            wp_send_json_error(array('message' => 'Invalid request'));
            return;
        }
        
        $action = $_POST['mapping_action'];
        $domain = isset($_POST['domain']) ? sanitize_text_field($_POST['domain']) : '';
        $page_id = isset($_POST['page_id']) ? intval($_POST['page_id']) : 0;
        
        error_log("Action: $action, Domain: $domain, Page ID: $page_id");
        
        $options = get_option('sip_domain_mapper_options', array());
        $mappings = isset($options['mappings']) ? $options['mappings'] : array();
        
        error_log('Current mappings: ' . print_r($mappings, true));
        error_log('Mappings before action: ' . print_r($mappings, true));
    
        if ($action === 'add') {
            $mappings[$domain] = $page_id;
        } elseif ($action === 'remove') {
            unset($mappings[$domain]);
    	} elseif ($action === 'get') {
        	wp_send_json_success(array('mappings' => $mappings));
        	return;       		// Just return the current mappings
    	}
        
        $options['mappings'] = $mappings;
        update_option('sip_domain_mapper_options', $options);
        
    	error_log('Mappings after action: ' . print_r($mappings, true));

        wp_send_json_success(array('mappings' => $mappings));
    }

    public function enqueue_admin_scripts($hook) {
        $screen = get_current_screen();
        if ('stuff-is-parts_page_sip-domain-mapper' !== $screen->id) {
            return;
        }
        wp_enqueue_style('sip-domain-mapper-admin-css', plugins_url('sip-domain-mapper/assets/css/sip-domain-mapper.css', dirname(__FILE__)));
        wp_enqueue_script('sip-domain-mapper-admin-js', plugins_url('sip-domain-mapper/assets/js/sip-domain-mapper.js', dirname(__FILE__)), array('jquery'), '1.0', true);

        // Debug information
		wp_localize_script('sip-domain-mapper-admin-js', 'sipDebug', array(
		    'hook' => $hook,
		    'screen_id' => $screen->id,
		    'plugin_url' => plugins_url('sip-domain-mapper', dirname(__FILE__)),
		    'nonce' => wp_create_nonce('sip_domain_mapper_nonce'),
		    'ajaxurl' => admin_url('admin-ajax.php')
		));
    }

	public function get_pages_for_mapping() {
    	error_log('get_pages_for_mapping called');
    	check_ajax_referer('sip_domain_mapper_nonce', '_ajax_nonce');
    	$pages = get_pages();
    	$page_options = array();
    	foreach ($pages as $page) {
        	$page_options[$page->ID] = $page->post_title;
    	}
    	error_log('Pages fetched: ' . print_r($page_options, true));
    	wp_send_json_success($page_options);
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
            'sip-domain-mapper-admin'
        );

        add_settings_field(
            'mappings',
            'Mappings',
            array($this, 'mappings_callback'),
            'sip-domain-mapper-admin',
            'sip_domain_mapper_setting_section'
        );
    }

    public function sanitize($input) {
        $new_input = array();
        if (isset($input['mappings'])) {
            foreach ($input['mappings'] as $mapping) {
                if (!empty($mapping['domain']) && !empty($mapping['page_id'])) {
                    $new_input['mappings'][] = array(
                        'domain' => sanitize_text_field($mapping['domain']),
                        'page_id' => intval($mapping['page_id'])
                    );
                }
            }
        }
        return $new_input;
    }

    public function section_info() {
        echo 'Add domain to page mappings below. Each mapping will redirect visitors from the specified domain to the selected WordPress page.';
    }

	public function mappings_callback() {
    	$mappings = isset($this->options['mappings']) ? $this->options['mappings'] : array();
    	$pages = get_pages();
    	?>
    	<div id="domain-page-mappings">
        	<?php foreach ($mappings as $index => $mapping): ?>
        	<div class="mapping">
            	<input type="text" name="sip_domain_mapper_options[mappings][<?php echo $index; ?>][domain]" value="<?php echo esc_attr($mapping['domain']); ?>" placeholder="Enter domain (e.g., example.com)" />
            	<select name="sip_domain_mapper_options[mappings][<?php echo $index; ?>][page_id]">
                	<option value="">Select a page</option>
                	<?php
                	foreach ($pages as $page) {
                    	echo '<option value="' . $page->ID . '"' . selected($mapping['page_id'], $page->ID, false) . '>' . esc_html($page->post_title) . '</option>';
                	}
                	?>
            	</select>
            	<button type="button" class="remove-mapping button">Remove</button>
        	</div>
        	<?php endforeach; ?>
    	</div>
    	<button type="button" id="add-mapping" class="button button-secondary">Add New Mapping</button>
    	<?php
	}

	public function check_domain_and_redirect() {
    	$current_domain = $_SERVER['HTTP_HOST'];
    	$options = get_option('sip_domain_mapper_options', array());
    	$mappings = isset($options['mappings']) ? $options['mappings'] : array();

    	if (isset($mappings[$current_domain])) {
        	$page_id = $mappings[$current_domain];
        	$page_url = get_permalink($page_id);
        	if ($page_url) {
            	wp_redirect($page_url);
            	exit;
        	}
    	}
	}

	public function debug_print_mappings() {
    	global $wpdb;
    	$option_value = $wpdb->get_var(
        	$wpdb->prepare(
            	"SELECT option_value FROM $wpdb->options WHERE option_name = %s",
            	'sip_domain_mapper_options'
        	)
    	);
    	echo '<pre>';
    	print_r(maybe_unserialize($option_value));
    	echo '</pre>';
	}        
            
}

function menu_page_exists($menu_slug) {
    global $menu;
    foreach ($menu as $item) {
        if (strtolower($item[0]) == strtolower($menu_slug)) {
            return true;
        }
    }
    return false;
}

$sip_domain_mapper = new SIPDomainMapper();

// Add submenu page under 'SiP Plugins'
add_action('admin_menu', 'sip_domain_mapper_add_submenu');
function sip_domain_mapper_add_submenu() {
    add_submenu_page(
        'sip-plugins',
        'Domain Mapper Settings',
        'Domain Mapper',
        'manage_options',
        'sip-domain-mapper-settings',
        'sip_domain_mapper_settings_page'
    );
}