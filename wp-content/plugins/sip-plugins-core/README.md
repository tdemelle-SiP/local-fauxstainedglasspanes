# SiP Plugins

This directory contains the core files and individual plugins for the SiP (Stuff is Parts) plugin suite.

Flow Document for SiP Plugin Suite

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
	│   │	└── images/
	│	│		└── spinner.webp
	│	│		└── SiP-Logo-24px.svg	
	│	├── README.md
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