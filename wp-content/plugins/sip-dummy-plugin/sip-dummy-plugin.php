<?php
/*
Plugin Name: SiP Dummy Plugin
Description: A dummy plugin for testing SiP Plugins Core integration
Version: 1.4
Author: Stuff is Parts, LLC
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

require_once(WP_PLUGIN_DIR . '/sip-plugins-core/sip-plugin-framework.php');

class SiP_Dummy_Plugin {
    public static function render_admin_page() {
        echo '<div class="wrap">';
        echo '<h1>SiP Dummy Plugin</h1>';
        echo '<p>This is a dummy plugin for testing SiP Plugins Core integration.</p>';
        echo '</div>';
    }
}

SiP_Plugin_Framework::init_plugin(
    'SiP Dummy Plugin',
    __FILE__,
    'SiP_Dummy_Plugin'
);