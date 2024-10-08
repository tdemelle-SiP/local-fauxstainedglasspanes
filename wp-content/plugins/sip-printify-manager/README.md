# SiP Printify Manager Plugin

## Overview

The **SiP Printify Manager** is a WordPress plugin designed to seamlessly integrate with the Printify API, enabling users to bulk create and manage Printify products efficiently. This plugin streamlines the process of template creation and bulk product generation, enhancing productivity for users managing extensive product catalogs.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [1. User Authentication](#1-user-authentication)
  - [2. Data Retrieval](#2-data-retrieval)
  - [3. Product Listing](#3-product-listing)
  - [4. Template Creation](#4-template-creation)
  - [5. Bulk Product Creation](#5-bulk-product-creation)
- [Template Creation from Product Data](#template-creation-from-product-data)
- [Product Creation Using Templates](#product-creation-using-templates)
- [Security](#security)
- [Plugin Structure](#plugin-structure)
- [Changelog](#changelog)
- [Future Enhancements](#future-enhancements)
- [Support and Contact](#support-and-contact)
- [License](#license)

---

## Features

- **Secure API Integration:** Connects to Printify API securely using encrypted API tokens.
- **Template Creation:** Generate templates from existing products for easy bulk creation.
- **Bulk Product Creation:** Create multiple products simultaneously using predefined templates.
- **User-Friendly Interface:** Intuitive design for managing products and templates within the WordPress admin dashboard.
- **AJAX-Powered Actions:** Smooth and responsive interactions without page reloads.
- **Data Encryption:** Sensitive data like API tokens are securely encrypted before storage.
- **Internationalization Support:** Prepared for translation to support multiple languages.
- **Accessibility Enhancements:** Improved accessibility for users with assistive technologies.

---

## Installation

1. **Upload the Plugin:**
   - Upload the `sip-printify-manager` folder to the `/wp-content/plugins/` directory.

2. **Activate the Plugin:**
   - Navigate to the 'Plugins' menu in WordPress and activate the **SiP Printify Manager** plugin.

3. **Dependencies:**
   - Ensure that the `sip-plugins-core` framework is also installed and activated, as it is required for this plugin to function correctly.

---

## Usage

### 1. User Authentication

- **Enter API Key:**
  - Navigate to the **SiP Printify Manager** menu in the WordPress admin dashboard.
  - Enter your Printify API token in the provided field.
  - Your API token is securely encrypted and stored.

### 2. Data Retrieval

- **Fetch Shop Details:**
  - The plugin uses the API to retrieve your Printify shop details.
- **Fetch Products:**
  - Retrieves all products associated with your shop.

### 3. Product Listing

- **View Products:**
  - Products are listed in the plugin interface for easy management.
- **Product Actions:**
  - **Reload:** Refresh the product list from Printify.
  - **Create Template:** Generate a template from selected products.
  - **Remove from Manager:** Remove selected products from the manager interface.

### 4. Template Creation

- **Generate Templates:**
  - Create templates from existing products to streamline bulk product creation.
- **Manage Templates:**
  - **Edit Template:** Modify the template content as needed.
  - **Rename Template:** Change the template name for better organization.
  - **Delete Template:** Remove templates that are no longer needed.

### 5. Bulk Product Creation

*(Feature Under Development)*

- **Use Templates for Bulk Creation:**
  - Utilize templates to create multiple new products by specifying variable data such as titles, tags, images, and text.
- **Data Entry Table:**
  - Input data for each new product in a tabular format.
- **Execute Bulk Creation:**
  - The plugin processes the data and makes API calls to Printify to create new products.

---

## Template Creation from Product Data

The purpose of a template is to represent the data necessary to use the Printify Product Creation API call (`POST /v1/shops/{shop_id}/products.json`) to create a new product. This template data format is derived from existing products.

**Process:**

1. **Select Source Product:**
   - Choose a product from the product list to create a template.

2. **Execute Create Template Action:**
   - The plugin processes the selected product's data to strip out unnecessary information.
   - Retains essential data fields required for new product creation.
   - Converts specific data into variables (e.g., `image_01`, `text_01`) for easy substitution during bulk creation.

3. **Store Template:**
   - The template is saved securely for future use.

---

## Product Creation Using Templates

*(Feature Under Development)*

1. **Select Template:**
   - Choose a template to use for creating new products.

2. **Data Entry:**
   - Provide data for each new product:
     - **Title**
     - **Tags**
     - **Image URLs** (e.g., `image_01`, `image_02`)
     - **Text Variables** (e.g., `text_01`, `text_02`)

3. **Add Multiple Products:**
   - Add multiple rows in the data table to create numerous products at once.

4. **Execute Creation:**
   - The plugin generates JSON data and makes API calls to Printify to create each new product.

5. **Progress Indicators:**
   - Visual feedback during the product creation process to inform the user of the status.

6. **Error Handling:**
   - Detailed messages for any failures during product creation, allowing for easy troubleshooting.

---

## Security

- **API Token Encryption:**
  - API tokens are encrypted using AES-256-CBC encryption before being stored in the database.

- **Nonce Verification:**
  - All AJAX requests include nonce verification to protect against CSRF attacks.

- **Data Sanitization:**
  - User inputs are sanitized and validated to prevent security vulnerabilities.

- **Access Control:**
  - Capability checks are implemented to ensure only authorized users can access plugin features.

---

## Plugin Structure

==============================PLUGIN FOLDER STRUCTTURE=============================

/wp-content/plugins/
	  ├── sip-plugins-core/
    └── sip-printify-manager/
        ├── assets/
        │   ├── css/
        │   │   └── sip-printify-manager.css
        │   └── js/
        │       ├── ajax.js
        │       ├── eventHandler.js   
        │       ├── imageUpload.js
        │       ├── main.js
        │       ├── productCreation.js
        │       ├── spinner.js
        │       ├── templateEditor.js
        │       └── utilities.js
        ├── includes/
        │   ├── creation-functions.php     
        │   ├── image-functions.php     
        │   ├── shop-functions.php
        │   ├── product-functions.php
        │   └── template-functions.php
        ├── views/
        │   └── admin-page.php
        ├── sip-printify-manager.php
        └── README.md

==============================================================================


- **sip-printify-manager.php:**
  - The main plugin file that initializes the plugin and includes necessary files.
  - Contains the `SiP_Printify_Manager` class, which sets up actions and filters.

- **includes/:**
  - **shop-functions.php:** Functions related to shop management and API token handling.
  - **product-functions.php:** Functions for handling product actions and interactions with the Printify API.
  - **template-functions.php:** Functions for managing templates, including creation, editing, and deletion.

- **views/:**
  - **admin-page.php:** The admin page view file that renders the plugin interface within the WordPress dashboard.

- **assets/:**
  - **css/:**
    - **sip-printify-manager.css:** Stylesheet for the plugin's admin interface.
  - **js/:**
    - **sip-ajax.js:** JavaScript file handling AJAX requests and interactivity.
    - **sip-printify-manager.js:** Additional JavaScript for the plugin's functionality.

---

## Changelog

### Version 2.0

- **Refactored Codebase:**
  - Separated functionalities into specialized files for better organization and maintainability.
  - Introduced the `includes/` directory for shop, product, and template functions.
  - Moved HTML rendering to the `views/` directory.

- **Security Enhancements:**
  - Implemented encryption for API tokens using AES-256-CBC.
  - Added nonce verification for all AJAX requests.
  - Included capability checks to restrict access to authorized users.

- **User Interface Improvements:**
  - Improved the admin page layout for a more intuitive user experience.
  - Added loading spinners and progress indicators for better feedback during operations.

- **Internationalization Support:**
  - Added a text domain (`sip-printify-manager`) and wrapped strings in translation functions to prepare for localization.

- **Accessibility Enhancements:**
  - Ensured form fields have associated labels.
  - Added ARIA attributes to improve compatibility with assistive technologies.

- **Bug Fixes:**
  - Resolved issues with AJAX requests and data handling.
  - Fixed path and asset loading problems.

### Version 1.6

- **Initial Release:**
  - Basic functionality for connecting to the Printify API.
  - Ability to list products and create templates.

---

## Future Enhancements

1. **Bulk Product Creation Feature Completion:**
   - Finalize the functionality for creating new products using templates, including data entry tables and processing logic.

2. **Asynchronous Processing:**
   - Implement background processing for bulk operations to prevent server timeouts and improve performance.

3. **Advanced Template Features:**
   - Allow users to define custom variables and include conditional logic within templates for greater flexibility.

4. **Comprehensive Error Handling:**
   - Enhance error feedback for API interactions and user inputs, providing detailed messages and troubleshooting assistance.

5. **User Interface Enhancements:**
   - Introduce features like drag-and-drop for organizing templates and products.
   - Enable bulk editing capabilities for managing multiple items simultaneously.

6. **Analytics and Reporting:**
   - Provide users with insights into their usage, such as the number of products created and templates used.

7. **Documentation and Support:**
   - Develop in-plugin tutorials and a comprehensive FAQ section to assist users.

8. **Compatibility Testing:**
   - Ensure the plugin is compatible with the latest versions of WordPress and other popular plugins.

---

## Support and Contact

For assistance or inquiries, please contact **Stuff is Parts, LLC** at [support@stuffisparts.com](mailto:support@stuffisparts.com).

---

## License

The **SiP Printify Manager** plugin is licensed under the [GPL-2.0-or-later](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html) license.

---

**Note:** This plugin requires a valid Printify API token to function correctly. Ensure you comply with Printify's API usage policies when using this plugin.

---

Please refer to the plugin documentation and inline help for detailed instructions on using each feature. Regular updates and enhancements are planned, so keep the plugin updated to benefit from new features and improvements.
