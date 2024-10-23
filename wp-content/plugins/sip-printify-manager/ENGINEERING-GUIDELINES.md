

-------------------------------------------Notes to be incorporated-------------------------------------------------
the scheme for modularizing the code is based on the idea that code should be associated with the interface where its called.

For this reason, the create template function is in the products files not the template files because the create template action is executed in the product table.  The template actions that are executed on the created template files are then handled in the template files because they are executed from the template table.  Similarly, the Product Creation Table initialization is handled in the template files not the creation files because the create_new_products action is executed from the templates table.  The actions that are then executed within the Product Creation Table are handled in the creation files.

I was thinking this same principle would apply in the case of the template json editor so that the initialization and creation of the json editor would be handled in the creation files because the edit json button is in the Product Creation Table interface, but then, once opened, the interaction with the json editor would take place in the templateEditor files.  That would mean that the save_json_editor_changes and the close_json_editor changes would be handled in the templateEditor files, not the creation files.

For now, I want to focus on the saving loading and closing just in the Product Creation Table and worry about the actions in the json editor later.

------------------------------------------------js file standards----------------------------------------------------
// moduleTemplate.js

/**
 * Standard JavaScript Module Template
 * 
 * Structure:
 * 1. Namespace declaration
 * 2. Module definition (IIFE)
 * 3. Private variables/state
 * 4. Initialization functions
 * 5. Event handlers
 * 6. AJAX success handlers
 * 7. Utility functions
 * 8. Public interface
 * 9. AJAX registration
 */

var sip = sip || {};

sip.moduleTemplate = (function($, ajax, utilities) {
    // Private variables - kept to minimum, clearly named
    let selectedId = null;
    let isDirty = false;

    /**
     * Initialize the module
     * @param {Object} [config] Optional configuration object
     */
    function init(config) {
        // Always call attachEventListeners in init
        attachEventListeners();
        
        // Handle any initialization logic
        if (config) {
            initializeWithConfig(config);
        }
    }

    /**
     * Attach all event listeners for the module
     */
    function attachEventListeners() {
        // Group related events together
        // Use jQuery delegation for dynamic elements
        $('#module-form').on('submit', handleFormSubmit);
        
        // Use consistent event binding pattern
        $('#module-table')
            .on('click', '.editable', handleEdit)
            .on('click', '.delete-button', handleDelete);
    }

    /**
     * Handle form submission
     * @param {Event} e The submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        // Standard FormData handling pattern
        const formData = new FormData(e.target);
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'module_action');
        formData.append('module_action', formData.get('action_type'));
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('module_action', formData);
    }

    /**
     * Handle AJAX success responses
     * @param {Object} response The AJAX response object
     */
    function handleSuccessResponse(response) {
        if (response.success) {
            // Use switch for different action types
            switch(response.data.action) {
                case 'get_data':
                    handleGetDataSuccess(response.data);
                    break;
                case 'update_data':
                    handleUpdateDataSuccess(response.data);
                    break;
                default:
                    console.warn('Unhandled action type:', response.data.action);
            }
        } else {
            console.error('Error in AJAX response:', response.data);
            utilities.showToast('Error: ' + response.data, 5000);
        }
    }

    /**
     * Handle successful data retrieval
     * @param {Object} data The response data
     */
    function handleGetDataSuccess(data) {
        if (data.html) {
            $('#module-container').html(data.html);
        }
        utilities.hideSpinner();
    }

    /**
     * Handle successful data update
     * @param {Object} data The response data
     */
    function handleUpdateDataSuccess(data) {
        isDirty = false;
        utilities.showToast('Update successful', 3000);
    }

    /**
     * Utility function for common operations
     * @param {string} value The value to process
     * @returns {string} The processed value
     */
    function utilityFunction(value) {
        return value.trim().toLowerCase();
    }

    // Public interface
    // Only expose what's necessary for external use
    return {
        init: init, // Required for initialization from main.js
        handleSuccessResponse: handleSuccessResponse, // Required for AJAX handling
        utilityFunction: utilityFunction // Only if needed by other modules
    };

})(jQuery, sip.ajax, sip.utilities);

// Register AJAX success handler
sip.ajax.registerSuccessHandler('module_action', sip.moduleTemplate.handleSuccessResponse);

-----------------------------------------------------------------------------------------------------------

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

function sip_new_shop() {
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