<?php
// File: wp-content/plugins/sip-plugins-core/sip-plugins-core.php

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class SiP_Plugins_Core {
    private static $instance = null;
    private $plugins = array();

    private function __construct() {
        add_action('admin_menu', array($this, 'create_sip_menu'), 9);
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function create_sip_menu() {
        add_menu_page(
            'Stuff is Parts Plugins',
            'SiP Plugins',
            'manage_options',
            'sip-plugins',
            array($this, 'render_sip_plugins_page'),
            'dashicons-admin-plugins',
            30
        );
    }

    public function register_plugin($plugin_name, $plugin_file) {
        $this->plugins[$plugin_name] = $plugin_file;
    }

    public function render_sip_plugins_page() {
        ?>
        <div class="wrap">
            <h1>Stuff is Parts Plugins</h1>
            <div class="sip-plugins-list">
                <?php
                foreach ($this->plugins as $name => $file) {
                    $is_active = is_plugin_active($file);
                    $is_installed = file_exists(WP_PLUGIN_DIR . '/' . $file);
                    
                    echo '<div class="sip-plugin-item">';
                    echo '<h3>' . esc_html($name) . '</h3>';
                    
                    if ($is_installed && $is_active) {
                        $settings_page = admin_url('admin.php?page=' . sanitize_title($name) . '-settings');
                        echo '<a href="' . esc_url($settings_page) . '" class="button button-primary">Settings</a>';
                    } elseif ($is_installed && !$is_active) {
                        $activate_url = wp_nonce_url(admin_url('plugins.php?action=activate&plugin=' . $file), 'activate-plugin_' . $file);
                        echo '<a href="' . esc_url($activate_url) . '" class="button">Activate</a>';
                    } else {
                        // Replace with actual catalog or web page URL
                        $catalog_url = '#';
                        echo '<a href="' . esc_url($catalog_url) . '" class="button" target="_blank">Learn More</a>';
                    }
                    
                    echo '</div>';
                }
                ?>
            </div>
        </div>
        <?php
    }
}

function sip_plugins_core() {
    return SiP_Plugins_Core::get_instance();
}

sip_plugins_core();