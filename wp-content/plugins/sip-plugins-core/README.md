# SiP Plugins

This directory contains the core files and individual plugins for the SiP (Stuff is Parts) plugin suite.

## Directory Structure

/wp-content/plugins/sip-plugins/
	├── assets/
	│   ├── css/
	│   ├── images/
	│   └── js/
	├── sip-plugins-core.php
	├── sip-plugins-loader.php
	└── sip-[plugin]/
		├── assets/
		│   ├── css/
		│   ├── images/
		│   └── js/
		├── includes/
		└── sip-[plugin].php
        
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