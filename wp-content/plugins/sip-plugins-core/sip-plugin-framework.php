<?php
// File: wp-content/plugins/sip-plugins-core/sip-plugin-framework.php

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class SiP_Plugin_Framework {
    public static function init_plugin($name, $file, $class_name) {
        add_action('admin_menu', function() use ($name, $file, $class_name) {
            $slug = sanitize_title($name);
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

        register_activation_hook($file, function() {
            $core_plugin = 'sip-plugins-core/sip-plugins-core.php';
            if (!is_plugin_active($core_plugin)) {
                activate_plugin($core_plugin);
            }
        });
    }

    public static function get_all_sip_plugins() {
        $all_plugins = get_plugins();
        return array_filter($all_plugins, function($plugin, $file) {
            return strpos($file, 'sip-') === 0 && $file !== 'sip-plugins-core/sip-plugins-core.php';
        }, ARRAY_FILTER_USE_BOTH);
    }
}