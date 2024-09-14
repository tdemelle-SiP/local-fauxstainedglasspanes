<?php
/*
Plugin Name: SiP Plugins Core
Description: Core functionality for Stuff is Parts plugins
Version: 1.5
Author: Stuff is Parts, LLC
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class SiP_Plugins_Core {
    private static $instance = null;
    private $plugins = array();

    private function __construct() {
        add_action('admin_menu', array($this, 'add_menu_pages'), 9);
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_styles'));
        add_action('activated_plugin', array($this, 'handle_plugin_activation'), 10, 2);
        add_action('deactivated_plugin', array($this, 'handle_plugin_deactivation'), 10, 2);
        add_action('admin_footer-plugins.php', array($this, 'add_deactivation_warning'));
        add_action('admin_init', array($this, 'handle_sip_page_actions'));
        add_action('shutdown', array($this, 'maybe_deactivate_sip_plugins'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function add_menu_pages() {
        add_menu_page(
            'SiP Plugins',
            'SiP Plugins',
            'manage_options',
            'sip-plugins',
            array($this, 'render_main_page'),
            plugin_dir_url(__FILE__) . 'assets/images/SiP-Logo-24px.svg',
            30
        );
    }

    public function render_main_page() {
        $plugins = $this->get_all_sip_plugins();
        $core_plugin = plugin_basename(__FILE__);
        
        echo '<div class="wrap">';
        echo '<h1>SiP Plugins</h1>';
        echo '<p>Manage your Stuff is Parts plugins here.</p>';
        echo '<table class="wp-list-table widefat fixed striped sip-plugins-list">';
        echo '<thead><tr><th>Plugin Name</th><th>Status</th><th>Action</th></tr></thead>';
        echo '<tbody>';
        foreach ($plugins as $plugin_file => $plugin_data) {
            if ($plugin_file === $core_plugin) continue; // Skip core plugin
            
            $is_active = is_plugin_active($plugin_file);
            $slug = sanitize_title($plugin_data['Name']);
            $row_class = $is_active ? 'sip-installed-active' : 'sip-installed-inactive';
            
            echo "<tr class='$row_class'>";
            echo '<td>' . esc_html($plugin_data['Name']) . '</td>';
            echo '<td>' . ($is_active ? 'Active' : 'Inactive') . '</td>';
            echo '<td>';
            if ($is_active) {
                echo '<a href="' . admin_url('admin.php?page=' . $slug) . '" class="button">Settings</a> ';
                echo '<a href="' . wp_nonce_url(admin_url('admin.php?page=sip-plugins&action=deactivate&plugin=' . $plugin_file), 'deactivate-plugin_' . $plugin_file) . '" class="button">Deactivate</a>';
            } else {
                echo '<a href="' . wp_nonce_url(admin_url('admin.php?page=sip-plugins&action=activate&plugin=' . $plugin_file), 'activate-plugin_' . $plugin_file) . '" class="button">Activate</a>';
            }
            echo '</td>';
            echo '</tr>';
        }
        echo '</tbody>';
        echo '</table>';
        echo '</div>';
    }

    public function enqueue_admin_styles($hook) {
        if ('toplevel_page_sip-plugins' !== $hook) {
            return;
        }
        wp_enqueue_style('sip-admin-styles', plugin_dir_url(__FILE__) . 'assets/css/sip_plugins_core.css');
    }

    public function handle_plugin_activation($plugin, $network_wide) {
        if (strpos($plugin, 'sip-') === 0) {
            if (!is_plugin_active(plugin_basename(__FILE__))) {
                activate_plugin(plugin_basename(__FILE__));
            }
        }
    }

    public function handle_plugin_deactivation($plugin, $network_wide) {
        if ($plugin === plugin_basename(__FILE__)) {
            update_option('sip_core_deactivated', true);
        }
    }

    public function handle_sip_page_actions() {
        if (isset($_GET['page']) && $_GET['page'] === 'sip-plugins' && isset($_GET['action']) && isset($_GET['plugin'])) {
            $action = $_GET['action'];
            $plugin = $_GET['plugin'];
            
            if (!wp_verify_nonce($_GET['_wpnonce'], $action . '-plugin_' . $plugin)) {
                wp_die('Security check failed');
            }

            if ($action === 'activate') {
                activate_plugin($plugin);
            } elseif ($action === 'deactivate') {
                deactivate_plugins($plugin);
                
                // Check if this was the last SiP plugin
                $active_sip_plugins = $this->get_active_sip_plugins();
                if (empty($active_sip_plugins)) {
                    deactivate_plugins(plugin_basename(__FILE__));
                    wp_redirect(admin_url('plugins.php'));
                    exit;
                }
            }

            wp_redirect(admin_url('admin.php?page=sip-plugins'));
            exit;
        }
    }

    public function maybe_deactivate_sip_plugins() {
        if (get_option('sip_core_deactivated', false)) {
            $active_sip_plugins = $this->get_active_sip_plugins();
            if (!empty($active_sip_plugins)) {
                deactivate_plugins($active_sip_plugins);
            }
            delete_option('sip_core_deactivated');
        }
    }

    public function add_deactivation_warning() {
        $core_plugin = plugin_basename(__FILE__);
        ?>
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            $('tr[data-plugin="<?php echo $core_plugin; ?>"] .deactivate a').click(function(e) {
                return confirm('Warning: This will deactivate all active SiP plugins. Proceed?');
            });
        });
        </script>
        <?php
    }

    private function get_active_sip_plugins() {
        return array_filter(get_option('active_plugins'), function($plugin) {
            return strpos($plugin, 'sip-') === 0 && $plugin !== plugin_basename(__FILE__);
        });
    }

    private function get_all_sip_plugins() {
        return array_filter(get_plugins(), function($data, $plugin) {
            return strpos($plugin, 'sip-') === 0;
        }, ARRAY_FILTER_USE_BOTH);
    }

    public function register_plugin($name, $file, $callback) {
        $slug = sanitize_title($name);
        $this->plugins[$slug] = array(
            'name' => $name,
            'file' => $file,
            'callback' => $callback
        );
    }
}

function sip_plugins_core() {
    return SiP_Plugins_Core::get_instance();
}

add_action('plugins_loaded', 'sip_plugins_core', 5);