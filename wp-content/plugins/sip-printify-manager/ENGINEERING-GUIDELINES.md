# SiP Printify Manager - File Structure and Guidelines

## 1.1 PHP Files

### Main plugin file: `sip-printify-manager.php`
**Purpose:** Main entry point for the plugin. Initializes the plugin and sets up WordPress hooks.

**Guidelines:**
- Define plugin metadata (name, version, description, etc.)
- Include necessary files
- Define the main plugin class
- Set up activation, deactivation, and uninstall hooks
- Enqueue scripts and styles
- Initialize the plugin

**Example structure:**

```php
<?php
/*
Plugin Name: SiP Printify Manager
Version: X.X
Description: ...
*/

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(__FILE__) . 'includes/class-sip-printify-manager.php';

function run_sip_printify_manager() {
    $plugin = new SiP_Printify_Manager();
    $plugin->run();
}

run_sip_printify_manager();
```

### Specialized functionality files:

#### `shop-functions.php`
**Purpose:** Handles shop-related functionalities and Printify API interactions.

**Guidelines:**
- Include functions for API authentication
- Implement shop data retrieval and management
- Handle shop-specific AJAX actions

**Example structure:**

```php
<?php
function sip_handle_shop_action() {
    // Handle shop-related AJAX actions
}

function sip_get_shop_details($token) {
    // Retrieve shop details from Printify API
}

function sip_save_token() {
    // Save and encrypt the API token
}
```

#### `product-functions.php`
**Purpose:** Manages product-related operations.

**Guidelines:**
- Implement functions for product creation, updating, and deletion
- Handle product data retrieval and formatting
- Manage product-specific AJAX actions

**Example structure:**

```php
<?php
function sip_handle_product_action() {
    // Handle product-related AJAX actions
}

function sip_get_products($shop_id) {
    // Retrieve products from Printify API
}

function sip_create_product($product_data) {
    // Create a new product on Printify
}
```

#### `image-functions.php`
**Purpose:** Handles image upload, management, and processing.

**Guidelines:**
- Implement image upload functionality
- Handle image resizing and optimization
- Manage image-related AJAX actions

**Example structure:**

```php
<?php
function sip_handle_image_action() {
    // Handle image-related AJAX actions
}

function sip_upload_image($file) {
    // Handle image upload and processing
}

function sip_get_images($shop_id) {
    // Retrieve images from Printify API
}
```

#### `template-functions.php`
**Purpose:** Manages template creation and usage.

**Guidelines:**
- Implement functions for template creation and editing
- Handle template data storage and retrieval
- Manage template-specific AJAX actions

**Example structure:**

```php
<?php
function sip_handle_template_action() {
    // Handle template-related AJAX actions
}

function sip_create_template($product_data) {
    // Create a new template from product data
}

function sip_get_templates() {
    // Retrieve saved templates
}
```

#### `creation-functions.php`
**Purpose:** Handles bulk product creation functionality.

**Guidelines:**
- Implement functions for bulk product creation
- Handle CSV import/export functionality
- Manage creation-specific AJAX actions

**Example structure:**

```php
<?php
function sip_handle_creation_action() {
    // Handle creation-related AJAX actions
}

function sip_bulk_create_products($template_id, $product_data) {
    // Create multiple products based on a template
}

function sip_import_csv($file) {
    // Import product data from CSV
}
```

#### `utilities.php`
**Purpose:** Contains utility functions used across the plugin.

**Guidelines:**
- Implement reusable helper functions
- Avoid placing business logic here

**Example structure:**

```php
<?php
function sip_sanitize_input($input) {
    // Sanitize user input
}

function sip_format_price($price) {
    // Format price for display
}

function sip_log_error($message) {
    // Log error messages
}
```

### Admin page view: `views/admin-page.php`
**Purpose:** Renders the main admin interface for the plugin.

**Guidelines:**
- Focus on HTML structure and minimal PHP for data display
- Avoid including complex logic; use functions from other files

**Example structure:**

```php
<?php
// Check user capabilities
if (!current_user_can('manage_options')) {
    return;
}

// Get necessary data
$shop_details = sip_get_shop_details();
$products = sip_get_products();
$templates = sip_get_templates();
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    
    <!-- Shop details section -->
    <div id="shop-details">
        <!-- Display shop details -->
    </div>
    
    <!-- Products section -->
    <div id="products-section">
        <!-- Display products table -->
    </div>
    
    <!-- Templates section -->
    <div id="templates-section">
        <!-- Display templates table -->
    </div>
    
    <!-- Product creation section -->
    <div id="product-creation">
        <!-- Display product creation form -->
    </div>
</div>
```

## 1.2 JavaScript Files

### Core files:

#### `utilities.js`
**Purpose:** Provides utility functions for client-side operations.

**Guidelines:**
- Implement reusable helper functions
- Use the module pattern to avoid polluting the global namespace

**Example structure:**

```javascript
var sip = sip  {};

sip.utilities = (function($) {
    function formatPrice(price) {
        // Format price for display
    }

    function showToast(message, duration) {
        // Display a toast notification
    }

    return {
        formatPrice: formatPrice,
        showToast: showToast
    };
})(jQuery);
```

#### `ajax.js`
**Purpose:** Centralizes AJAX request handling.

**Guidelines:**
- Implement a centralized function for making AJAX requests
- Handle common AJAX errors and responses

**Example structure:**

```javascript
var sip = sip  {};

sip.ajax = (function($) {
    function handleAjaxAction(actionType, formData, successCallback, errorCallback) {
        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    successCallback(response.data);
                } else {
                    errorCallback(response.data);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                errorCallback(errorThrown);
            }
        });
    }

    return {
        handleAjaxAction: handleAjaxAction
    };
})(jQuery);
```

### Module files:

#### `product-actions.js`, `image-actions.js`, `template-actions.js`, `creation-actions.js`
**Purpose:** Handle UI interactions and AJAX calls for specific functionalities.

**Guidelines:**
- Use the module pattern
- Implement event listeners for UI interactions
- Call AJAX functions from `ajax.js`
- Update UI based on AJAX responses

**Example structure (product-actions.js):**

```javascript
var sip = sip  {};

sip.productActions = (function($, ajax, utilities) {
    function init() {
        $('#create-product-btn').on('click', handleCreateProduct);
        $('#reload-products-btn').on('click', handleReloadProducts);
    }

    function handleCreateProduct() {
        // Gather product data and call AJAX function
        var formData = new FormData($('#create-product-form')[0]);
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'product_action');
        formData.append('product_action', 'create_product');

        ajax.handleAjaxAction('product_action', formData, 
            function(response) {
                // Handle success
                utilities.showToast('Product created successfully');
                // Update UI
            },
            function(error) {
                // Handle error
                utilities.showToast('Error creating product: ' + error);
            }
        );
    }

    function handleReloadProducts() {
        // Implementation for reloading products
    }

    return {
        init: init
    };
})(jQuery, sip.ajax, sip.utilities);
```

### Initialization files:

#### `init.js`
**Purpose:** Initializes all JavaScript modules.

**Guidelines:**
- Ensure all modules are loaded before initialization
- Handle any global setup required before module initialization

**Example structure:**

```javascript
var sip = sip  {};

sip.init = (function($, productActions, imageActions, templateActions, creationActions) {
    function initializeAllModules() {
        productActions.init();
        imageActions.init();
        templateActions.init();
        creationActions.init();
    }

    return {
        initializeAllModules: initializeAllModules
    };
})(jQuery, sip.productActions, sip.imageActions, sip.templateActions, sip.creationActions);
```

#### `main.js`
**Purpose:** Entry point for JavaScript execution.

**Guidelines:**
- Set up any global error handlers
- Call the init function when the document is ready

**Example structure:**

```javascript
(function($) {
    $(document).ready(function() {
        sip.init.initializeAllModules();
    });

    // Global error handler
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Global error:', message, 'at', source, 'line', lineno, ':', error);
        sip.utilities.showToast('An error occurred. Please try again or contact support.');
    };
})(jQuery);
```

## General Best Practices:
1. Use consistent naming conventions across all files (e.g., prefix all functions with `sip_` in PHP and use camelCase in JavaScript).
2. Keep functions focused and modular. Each function should do one thing and do it well.
3. Comment complex logic and provide function documentation using PHPDoc for PHP and JSDoc for JavaScript.
4. Adhere to WordPress coding standards for PHP files (https://make.wordpress.org/core/handbook/best-practices/coding-standards/php/).
5. Use ESLint or similar tools to maintain JavaScript code quality and consistency.
6. Implement comprehensive error handling and logging in both PHP and JavaScript.
7. Ensure all user inputs are properly sanitized and validated using WordPress functions like `sanitize_text_field()` and `wp_kses()`.
8. Use nonce verification for all AJAX actions to prevent CSRF attacks.
9. Keep the separation of concerns in mind when adding new functionality. If a new feature doesn't fit into existing files, consider creating a new module.
10. Use WordPress transients for caching frequently accessed data to improve performance.
11. Optimize database queries and use `$wpdb->prepare()` for all database operations involving variables.
12. Implement proper data cleanup on plugin deactivation and provide options for users to export their data.
13. Use WordPress hooks and filters to make the plugin extensible.
14. Keep the UI consistent with WordPress admin design patterns.
15. Ensure all strings are internationalized using WordPress i18n functions.

By following these guidelines and best practices, you'll maintain a clean, efficient, and maintainable codebase for the SiP Printify Manager plugin.