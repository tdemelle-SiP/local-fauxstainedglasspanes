# SiP Plugins

This directory contains the core files and individual plugins for the SiP (Stuff is Parts) plugin suite.

# SiP Plugin Suite Documentation

## Overview

The SiP (Stuff is Parts) Plugin Suite is a framework for creating and managing a collection of WordPress plugins. It consists of a core plugin (SiP Plugins Core) and individual SiP plugins that integrate with this core.

## Structure

1. **SiP Plugins Core**: The central plugin that manages all SiP plugins.
2. **Individual SiP Plugins**: Plugins that integrate with the core and provide specific functionality.

## SiP Plugins Core

The core plugin provides the following functionality:

- Creates a main menu item in the WordPress admin for all SiP plugins.
- Manages the activation and deactivation of SiP plugins.
- Provides a framework for SiP plugins to register themselves.

### Key Components

- `SiP_Plugins_Core` class: Manages the core functionality.
- `add_menu_pages()`: Creates the main SiP Plugins menu.
- `deactivate_core()`: Deactivates all SiP plugins when the core is deactivated.

## Setting Up a New SiP Plugin

To create a new plugin that works with the SiP suite:

1. Create a new PHP file for your plugin (e.g., `sip-my-plugin.php`).
2. Use the following template:

```php
<?php
/*
Plugin Name: SiP My Plugin
Description: Description of your plugin
Version: 1.0
Author: Your Name
*/

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class SiP_My_Plugin {
    private static $instance = null;

    private function __construct() {
        add_action('plugins_loaded', array($this, 'init'));
    }

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function init() {
        if (function_exists('sip_plugins_core')) {
            add_action('admin_menu', array($this, 'register_submenu'), 20);
        }
    }

    public function register_submenu() {
        add_submenu_page(
            'sip-plugins',
            'My Plugin',
            'My Plugin',
            'manage_options',
            'sip-my-plugin',
            array($this, 'render_admin_page')
        );
    }

    public static function render_admin_page() {
        echo '<div class="wrap">';
        echo '<h1>My Plugin</h1>';
        echo '<p>This is the admin page for My Plugin.</p>';
        echo '</div>';
    }

    // Add your plugin's functionality here
}

function sip_my_plugin() {
    return SiP_My_Plugin::get_instance();
}

sip_my_plugin();
```

3. Customize the plugin name, description, and functionality as needed.
4. Ensure your plugin file starts with `sip-` for proper integration.

## Activation and Deactivation

- When any SiP plugin is activated, it will automatically activate the SiP Plugins Core if it's not already active.
- When the SiP Plugins Core is deactivated, it will deactivate all other SiP plugins.

## Best Practices

1. Always check if the core plugin is active before adding your plugin's functionality.
2. Use the provided hooks and methods for integration with the core.
3. Follow WordPress coding standards and best practices in your plugin development.

## Troubleshooting

If you encounter issues:

1. Ensure all SiP plugins follow the naming convention (starting with `sip-`).
2. Check that the SiP Plugins Core is installed and activated.
3. Verify that your plugin is properly hooked into the `plugins_loaded` action.
4. Review the WordPress debug log for any error messages.

Initial Flow Design Document for SiP Plugin Suite

There are currently two individual SiP plugins in the suite, sip-printify-manager and sip-domain-mapper, but it will continue to expand to include new plugins over time.

Each plugin is available for download on the stuffisparts.design website and each plugin will be available for download from the wordpress plugins catalog

When a user installs a specific SiP plugin, the SiP suite manager (sip-plugins-core) is installed in addition to the individual plugin.

The manager is responsible for creating the icon in the wp-admin sidebar and the top level SiP Plugins Suite page as described below.  The SiP manager is not available by itself; it is only installed alongside any of the other sip suite plugins.  Although each individual sip plugin will have the capacity to install the manager by itself, only the first installed sip plugin will actually install it and only the last remaining sip plugin will uninstall it when it is deactivated and deleted.  After the first plugin has installed the manager, subsequent sip suite plugins will simply supplement the data that the manager shows on the manager page.

When an individual SiP suite plugin is installed it appears in the plugins list in the wordpress installation where it has been installed.

When the first installed sip plugin suite plugin is activated, the sip suite manager adds a new tab with a custom icon to the wordpress admin side bar.

When the SiP Plugins tab in the sidebar is rolled over, there is a flyout that shows two entries
	-SiP Plugins (driven by the manager)
	-<The installed sip plugin>

Selecting "SiP plugins" from the flyout will bring up an admin page entitled "Stuff is Parts Plugins Suite" showing the following:
	A blurb with general information about Stuff is Parts and the Stuff is Parts Suite.
	A list of all the available sip-plugins. The list can be updated (in plugin updates presumably) as new plugins are added.
		Each plugin on the list that is installed and activated is linked to that specific plugin's main admin page, also accessible by clicking the plugin's entry in the flyout.
		Each plugin that is installed and not activated will have a small activate button next to it that will activate it
			When a new plugin is actived
				Another entry is added to the SiP Plugins admin tab flyout that links to that plugins admin page
					-SiP Plugins
					-<sip-plugin-a>
					-<sip-plugin-b>
				The entry in the Stuff is Parts Plugins Suite list turns into a link that points to the settings/controls page
		Each plugin that is not installed will be linked to either the plugin in the Wordpress catalog from where it can be installed or its page on the stuffisparts.design website from where it can be downloaded and installed.

Selecting An installed sip plugin entry in the SiP Plugins tab will bring up it's specific plugin controls and settings page.

## Directory Structure

/wp-content/plugins/
	├── sip-plugins-core/
	│   ├──  assets
	│ 	│ 	├── css
	│ 	│ 	│ 	└── sip-plugins-core.css
	│   │	├── images/
	│	│	│	└── spinner.webp
	│	│	│	└── SiP-Logo-24px.svg
	│	│	└──lib
	│	│		└── cm-resize.js
	│	├── README.md
	│	├── sip-core-plugin-integration.php
	│	└── sip-plugins-core.php
	├── sip-printify-manager/
	│	├── assets/
	│	│   ├── css/
	│	│   │   └── sip-printify-manager.css
	│	│   └── js/
	│	│	  	└── sip-ajax.js
	│	├── includes/
	│	│   ├── shop-functions.php
	│	│   ├── product-functions.php
	│	│   └── template-functions.php
	│	│   ├── image-functions.php	
	│	├── views/
	│	│   └── admin-page.php
	│	├── sip-printify-manager.php
	│	└── README.md
	└── sip-domain-mapper/
    	├── assets/
		│   ├── css/
		│   │   └── sip-domain-mapper.css
		│   └── js/
		│	  	└── sip-domain-mapper.js
		├── sip-domain-mapper.php
		└── README.md


## Description

- `assets/`: Contains shared resources for all SiP plugins.
- `sip-plugins-core.php`: Core functionality for the SiP plugin suite.
- `sip-plugins-loader.php`: Loads and initializes all SiP plugins.
- `sip-domain-mapper/`: SiP Domain Mapper plugin directory.
- `sip-printify-manager/`: SiP Printify Manager plugin directory.

Each plugin has its own `assets/` directory for plugin-specific resources.

## Installation

1. Upload the entire `sip-plugins` directory to the `/wp-content/plugins/` directory.
2. Activate the desired SiP plugins through the 'Plugins' menu in WordPress.

## Usage

[Add usage instructions here]

## Contributing

[Add contribution guidelines here]

## License

[Add license information here]