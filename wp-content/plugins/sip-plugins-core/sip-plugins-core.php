<?php
/*
Plugin Name: SiP Plugins Core
Description: Core functionality for Stuff is Parts plugins
Version: 2.1
Author: Stuff is Parts, LLC
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class SiP_Plugins_Core {
    private static $instance = null;

    private function __construct() {
        add_action('admin_menu', array($this, 'add_menu_pages'), 9);
        add_action('admin_init', array($this, 'handle_plugin_actions'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate_core'));
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
            'dashicons-admin-plugins',
            30
        );
    }

    public function render_main_page() {
        echo '<div class="wrap"><h1>SiP Plugins</h1><p>Manage your Stuff is Parts plugins here.</p></div>';
    }

    public function handle_plugin_actions() {
        // Simplified plugin action handling
    }

    public function deactivate_core() {
        $active_plugins = get_option('active_plugins', array());
        foreach ($active_plugins as $plugin) {
            if (strpos($plugin, 'sip-') === 0 && $plugin !== plugin_basename(__FILE__)) {
                deactivate_plugins($plugin);
            }
        }
    }
}

function sip_plugins_core() {
    return SiP_Plugins_Core::get_instance();
}

add_action('plugins_loaded', 'sip_plugins_core', 5);