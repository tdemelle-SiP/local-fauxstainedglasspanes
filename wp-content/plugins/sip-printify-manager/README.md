# SiP Printify Manager Plugin

## Overview

The **SiP Printify Manager** is a WordPress plugin designed to seamlessly integrate with the Printify API, enabling users to efficiently manage and create Printify products. This plugin streamlines the process of product management, image handling, template creation, and bulk product generation, enhancing productivity for users managing extensive product catalogs on Printify.

---

## Features

- **Intuitive Interface:** Single-page interface for managing products, images, and templates.
- **Product Management:** View and search existing Printify products, create templates from products.
- **Image Management:** Upload, view, and manage images for use in product designs.
- **Template System:** Create and manage templates for efficient product creation.
- **Bulk Product Creation:** Use templates to create multiple new products simultaneously.
- **CSV Import/Export:** Facilitate bulk operations through CSV file handling.
- **Secure API Integration:** Connects to Printify API securely using encrypted API tokens.
- **AJAX-Powered Actions:** Smooth and responsive interactions without page reloads.

---

## Installation

1. Upload the `sip-printify-manager` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Navigate to the SiP Printify Manager page in your WordPress admin area.

---

## Quick Start Guide

1. Click "New Shop Token" to enter your Printify API token.
2. View your existing products in the Products section.
3. Upload and manage images in the Images section.
4. Create templates from existing products or create new ones.
5. Use the Product Creation Table to create new products based on templates.

For detailed usage instructions, please see our [Detailed Usage Guide](DETAILED_USAGE.md).

---

## Plugin Structure
```
sip-printify-manager/
├── assets/
│   ├── css/
│   │   └── sip-printify-manager.css
│   └── js/
│       ├── core/
│       │   ├── ajax.js
│       │   └── utilities.js
│       ├── modules/
│       │   ├── product-actions.js
│       │   ├── image-actions.js
│       │   ├── template-actions.js
│       │   └── creation-actions.js
│       ├── init.js
│       └── main.js
├── includes/
│   ├── shop-functions.php
│   ├── product-functions.php
│   ├── image-functions.php
│   ├── template-functions.php
│   ├── creation-functions.php
│   └── utilities.php
├── views/
│   └── admin-page.php
├── sip-printify-manager.php
├── DOCUMENTATION.md
├── CODE-GUIDELINES.php
└── README.md
```
---

## Development

For developers interested in contributing or extending the plugin, please refer to our [Project Engineering Guide](PROJECT_ENGINEERING_GUIDE.md) for coding standards, architecture overview, and best practices.

---

## Support and Contact

For assistance or inquiries, please contact Stuff is Parts, LLC at [support@stuffisparts.com](mailto:support@stuffisparts.com).

---

## License

The SiP Printify Manager plugin is licensed under the [GPL-2.0-or-later](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html) license.

---

**Note:** This plugin requires a valid Printify API token to function correctly. Ensure you comply with Printify's API usage policies when using this plugin.