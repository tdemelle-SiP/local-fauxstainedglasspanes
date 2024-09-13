<?php
// File: wp-content/plugins/sip-plugins-core/sip-plugin-framework.php

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class SiP_Plugin_Framework {
    private static $registered_plugins = array();

    public static function init_plugin($name, $file, $class_name) {
        self::register_plugin($name, $file, $class_name);
        register_activation_hook($file, array(__CLASS__, 'activate_sip_plugin'));
        register_deactivation_hook($file, array(__CLASS__, 'deactivate_sip_plugin'));
    }

    private static function register_plugin($name, $file, $class_name) {
        $slug = sanitize_title($name);
        self::$registered_plugins[$slug] = array(
            'name' => $name,
            'file' => $file,
            'class' => $class_name
        );

        add_action('admin_menu', function() use ($name, $slug, $class_name) {
            add_submenu_page(
                'sip-plugins',
                $name,
                $name,
                'manage_options',
                $slug,
                function() use ($class_name, $name) {
                    echo '<div class="wrap">';
                    echo '<h1>' . esc_html($name) . '</h1>';
                    echo '<p><a href="' . admin_url('admin.php?page=sip-plugins') . '">&larr; Back to SiP Plugins</a></p>';
                    call_user_func(array($class_name, 'render_admin_page'));
                    echo '</div>';
                }
            );
        });
    }

    public static function activate_sip_plugin($plugin_file) {
        $core_plugin = 'sip-plugins-core/sip-plugins-core.php';
        if (!is_plugin_active($core_plugin)) {
            activate_plugin($core_plugin);
        }
    }

    public static function deactivate_sip_plugin($plugin_file) {
        $core_plugin = 'sip-plugins-core/sip-plugins-core.php';
        $active_sip_plugins = self::get_active_sip_plugins();
        if (count($active_sip_plugins) <= 1 && is_plugin_active($core_plugin)) {
            deactivate_plugins($core_plugin);
        }
    }

    public static function get_active_sip_plugins() {
        return array_filter(get_option('active_plugins'), function($plugin) {
            return strpos($plugin, 'sip-') === 0 && $plugin !== 'sip-plugins-core/sip-plugins-core.php';
        });
    }

    public static function get_all_sip_plugins() {
        $all_plugins = get_plugins();
        return array_filter($all_plugins, function($plugin, $file) {
            return strpos($file, 'sip-') === 0 && $file !== 'sip-plugins-core/sip-plugins-core.php';
        }, ARRAY_FILTER_USE_BOTH);
    }

    public static function deactivate_all_sip_plugins() {
        $active_sip_plugins = self::get_active_sip_plugins();
        deactivate_plugins($active_sip_plugins);
    }
}