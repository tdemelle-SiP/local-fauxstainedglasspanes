<?php
// File: wp-content/plugins/sip-plugins-core/sip-plugins-core.php

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class SiP_Plugins_Core {
    private static $instance = null;
    private $plugins = array();

    private function __construct() {
        add_action('admin_menu', array($this, 'create_sip_menu'), 9);
        add_action('admin_menu', array($this, 'create_plugin_submenu_items'), 11);
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function create_sip_menu() {
        add_menu_page(
            'Stuff is Parts Plugin Suite',
            'SiP Plugins',
            'manage_options',
            'sip-plugins',
            array($this, 'render_sip_plugins_page'),
            plugin_dir_url(__FILE__) . 'assets/images/SiP-Logo-24px.svg',
            30
        );
    }

    public function create_plugin_submenu_items() {
        foreach ($this->plugins as $plugin_name => $plugin_data) {
            add_submenu_page(
                'sip-plugins',
                $plugin_name,
                $plugin_name,
                'manage_options',
                $plugin_data['slug'],
                $plugin_data['callback']
            );
        }
    }

    public function register_plugin($plugin_name, $plugin_file, $callback) {
        $this->plugins[$plugin_name] = array(
            'file' => $plugin_file,
            'slug' => sanitize_title($plugin_name),
            'callback' => $callback
        );
        $this->log_debug("Plugin registered: $plugin_name");
    }

    public function render_sip_plugins_page() {
        ?>
        <div class="wrap">
            <h1>Stuff is Parts Plugin Suite</h1>
            <p>Welcome to the Stuff is Parts Plugin Suite. Below is a list of all available SiP plugins:</p>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>Plugin Name</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($this->plugins as $plugin_name => $plugin_data): ?>
                        <tr>
                            <td><?php echo esc_html($plugin_name); ?></td>
                            <td><?php echo is_plugin_active($plugin_data['file']) ? 'Active' : 'Inactive'; ?></td>
                            <td>
                                <?php if (is_plugin_active($plugin_data['file'])): ?>
                                    <a href="<?php echo admin_url('admin.php?page=' . $plugin_data['slug']); ?>" class="button">Settings</a>
                                <?php else: ?>
                                    <a href="<?php echo wp_nonce_url(admin_url('plugins.php?action=activate&plugin=' . $plugin_data['file']), 'activate-plugin_' . $plugin_data['file']); ?>" class="button">Activate</a>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function maybe_deactivate() {
        $active_sip_plugins = 0;
        foreach ($this->plugins as $plugin_data) {
            if (is_plugin_active($plugin_data['file'])) {
                $active_sip_plugins++;
            }
        }
    
        if ($active_sip_plugins <= 1) {
            deactivate_plugins(plugin_basename(__FILE__));
        }
    }

    public function activate() {
        update_option('sip_core_activated', true);
    }

    public function log_debug($message) {
        $log_file = WP_CONTENT_DIR . '/sip-debug.log';
        $timestamp = current_time('mysql');
        file_put_contents($log_file, "$timestamp: $message\n", FILE_APPEND);
    }
}

function sip_plugins_core() {
    return SiP_Plugins_Core::get_instance();
}

sip_plugins_core();