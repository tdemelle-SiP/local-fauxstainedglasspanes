The initial primary goal for the SiP Printify Manager plugin for wordpress is to enable the ability to easily and efficiently bulk create new Printify products using the Printify API.  The high level workflow is as follows:
-User enters API Key - UX and Functionally Complete
-The Manager uses the API to return the user's Printify Store <GET /v1/shops.json> and its Products <GET /v1/shops/{shop_id}/products.json>. - UX and Functionally Complete
-The products are listed in the plugin interface. - UX and Functionally Complete
-There is an option to create templates from the retrieved files. - UX and Functionally Complete
-The files created are optimized to be used in the plugin's product creation functionality. - Needs to be developed. Details to follow.
-The templates can be used to bulk create large quantities of new products through the Printify API.

===================TEMPLATE CREATION FROM PRODUCT DATA==============================

The purpose of a template is to represent the data necessary to use the Printify Product Creation API call <POST /v1/shops/{shop_id}/products.json> to create a new product.  This template data format can be extrapolated from existing products.

As described above, any of the Products listed in the plugin can be selected to make a template.  

    The template creation process proceeds as follows:
        -When the Create Template action is executed on a selected source product, a python script is run on the selected source product .json that strips out all the data that is not necessary for new product creation.  This includes:
            "id": 
            "options": [{}]
            "images": [{}]
            "created_at":
            "updated_at":
            "visible":
            "is_locked":
            "external": {}
            "user_id":
            "shop_id":
            "print_details": []
            "sales_channel_properties": []
            "is_printify_express_eligible":
            "is_printify_express_enabled":
            "is_economy_shipping_eligible":
            "is_economy_shipping_enabled":
        -Certain keys are stripped of content but left intact to hold data for the template:
            "tags":
        -Data specified in the product will be converted into variables that can be replaced.  However many images there are will be captured as variables "image_01", "image_02", etc.  Text will be similarly captured as "text_01", "text_02".  These placeholder names will be saved in the appropriate places throughout the template so they can be easily swapped with new data later in the new product creation process as described below.
        -This template will be permanently stored for the user to use or remove at their discretion.

=====================PRODUCT CREATION USING TEMPLATES================================
When the user selects a template and executes the create product requests action, the template stays selected and a table appears that holds fields for data entry for the new product/s.
The data the User will provide to inject into the template is simply:
    - Title
    - Tags
    - url of image to swap in for main design
    - Text to swap in for main text.
Headers in the first row of the table should be based on whatever printable image and/or text variables are present in the  Title | Tags | Image_01 url | Image_02 url | etc | Text_01 | Text_02 | etc
Above the table there should be a button to add a new row in which another set of data can be added for another new product based on the same template.
Tens or even hundreds of new product data can be queued up.
If the user selects another template and executes the create product requests, the table is appended with any data fields that are not already represented in the existing image and text data.  If the data fields are all the same, the data already listed will map to the second template as well.
With the various templates to use selected in the templates list and the data table populated with rows representing the new productes to make from the templates, the user can then execute CREATE NEW PRODUCTS
The plugin will then cycle through all the rows for each template, generate .json files and make the API calls to Printify to create each new product specified.

============================LINKS/DOCUMENTATION REFERENCE==========================

REFERENCE GOOGLE SHEET
https://docs.google.com/spreadsheets/d/1twFAEjEgDgCfhI_qZlTRBLnUTCt0DVMDfW6EFPHXj3Y/edit?usp=sharing

FSGP PoD PRODUCT IMAGES
https://public.fauxstainedglasspanes.com/public_files/images/pod/

TEMPLATE REFERENCE WITH TITLE/DESCRIPTION/VARIANT DETAILS
D:\My Drive\FSGP\fsgp-docs\printify_templates

FSGP PRODUCTS ON PRINTIFY
https://printify.com/app/store/products/1

API DOCUMENTATION
https://developers.printify.com/#overview

==============================PLUGIN FOLDER STRUCTTURE=============================

/wp-content/plugins/
	├── sip-plugins-core/
    └── sip-printify-manager/
        ├── assets/
        │   ├── css/
        │   │   └── sip-printify-manager.css
        │   └── js/
        │       └── sip-ajax.js
        ├── includes/
        │   ├── shop-functions.php
        │   ├── product-functions.php
        │   └── template-functions.php
        ├── views/
        │   └── admin-page.php
        ├── sip-printify-manager.php
        └── README.md

==============================================================================

COMMENTS GENERATED FROM THE MAIN PHP FILE 24_09_17

/*
Plugin Name: SiP Printify Manager
Description: A plugin to help manage your Printify Shop and its Products
Version: 1.6
Author: Stuff is Parts, LLC
*/

// Prevent direct access to the file for security reasons

/**
 * Class SiP_Plugin_Framework
 *
 * This class serves as a framework for initializing and managing Stuff is Parts, LLC (SiP) plugins
 * within the WordPress admin interface. It handles plugin initialization, admin menu integration,
 * and ensures core dependencies are active.
 */

/**
 * Class SiP_Printify_Manager
 *
 * Main class for the SiP Printify Manager plugin. It handles API connections, store management,
 * product and template management, and integrates necessary scripts and shortcodes.
 */

// Singleton instance

// Plugin options stored in the database

// Plugin directory path

/**
 * Constructor
 *
 * Initializes plugin options, includes necessary files, and sets up actions and filters.
 */

/**
 * Get Instance
 *
 * Implements the singleton pattern to ensure only one instance of the class exists.
 *
 * @return SiP_Printify_Manager The singleton instance of the class.
 */

// ===============================
// 1. Initial API Connection
// ===============================

/**
 * Save API Token
 *
 * Saves the Printify API token after validating it by fetching shop details.
 */

/**
 * Reauthorize API Connection
 *
 * Revalidates the existing API token by fetching shop details.
 */

/**
 * Initialize New API Token Setup
 *
 * Clears existing API token and shop details to allow setting up a new token.
*/

// ===============================
// 2. Store Management
// ===============================

// (Note: Store management primarily involves handling shop details, which are managed in API Connection)

// ===============================
// 3. Product Management
// ===============================

/**
 * Handle Product Actions
 *
 * Executes actions on selected products based on user input.
 */

// ===============================
// 4. Template Management
// ===============================

/**
 * Handle Template Actions
 *
 * Executes actions on selected templates based on user input.
 */

/**
 * Save Edited Template
 *
 * Saves changes made to a template.
 */

// ===============================
// 5. New Product Creation Management
// ===============================

// (Note: New Product Creation may involve creating products via templates or API actions, handled in product and template management)

/**
 * Handle AJAX Requests
 *
 * Processes AJAX requests and routes them to the appropriate handler based on action type.
 */

/**
 * Enqueue Admin Scripts and Styles
 *
 * Loads necessary CSS and JavaScript files for the admin interface.
 *
 * @param string $hook The current admin page.
 */

/**
 * Enqueue Frontend Scripts and Styles
 *
 * Loads necessary CSS and JavaScript files for the frontend interface.
 */

/**
 * Render Products Shortcode
 *
 * Outputs the list of products when the [sip_printify_products] shortcode is used.
 *
 * @param array $atts Shortcode attributes.
 * @return string HTML content to display.
 */

// ===============================
// Admin Page Rendering
// ===============================

/**
 * Render Admin Page
 *
 * Outputs the HTML content for the plugin's admin page, including API connection setup,
 * shop details, product and template management interfaces.
 */

// ===============================
// Initialize the Plugin
// ===============================

// Instantiate the main plugin class

// Initialize the plugin framework to add the admin submenu and handle activation dependencies

===================================================================================

Summary of Plugin Overview from 24_09_12?

# SiP Printify Manager Plugin

## Overview

The **SiP Printify Manager** is a WordPress plugin designed to seamlessly integrate with the Printify API, enabling users to bulk create and manage Printify products efficiently. This plugin streamlines the process of template creation and bulk product generation, enhancing productivity for users managing extensive product catalogs.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Updated Project Outline with Essential Enhancements](#updated-project-outline-with-essential-enhancements)
  - [Primary Goal](#primary-goal)
  - [High-Level Workflow](#high-level-workflow)
    - [1. User Authentication](#1-user-authentication)
    - [2. Data Retrieval](#2-data-retrieval)
    - [3. Product Listing](#3-product-listing)
    - [4. Template Creation](#4-template-creation)
    - [5. Template Optimization](#5-template-optimization)
    - [6. Bulk Product Creation](#6-bulk-product-creation)
  - [Template Creation from Product Data](#template-creation-from-product-data)
  - [Product Creation Using Templates](#product-creation-using-templates)
- [Backlog: Prioritized Improvements and Enhancements](#backlog-prioritized-improvements-and-enhancements)
  - [1. Security Enhancements (High Priority)](#1-security-enhancements-high-priority)
  - [2. Robust Error Handling and Logging (High Priority)](#2-robust-error-handling-and-logging-high-priority)
  - [3. Scalability and Performance Optimization (High Priority)](#3-scalability-and-performance-optimization-high-priority)
  - [4. User Interface Enhancements (Medium Priority)](#4-user-interface-enhancements-medium-priority)
  - [5. Advanced Template Features (Medium Priority)](#5-advanced-template-features-medium-priority)
  - [6. Data Validation and Sanitization (Medium Priority)](#6-data-validation-and-sanitization-medium-priority)
  - [7. Comprehensive Documentation and Support (Low Priority)](#7-comprehensive-documentation-and-support-low-priority)
  - [8. Compatibility and Testing (Low Priority)](#8-compatibility-and-testing-low-priority)
  - [9. Analytics and Reporting (Low Priority)](#9-analytics-and-reporting-low-priority)
- [Implementation Prioritization Summary](#implementation-prioritization-summary)
- [Next Steps](#next-steps)

---

## Features

- **API Integration:** Connects to Printify API to retrieve and manage store products.
- **Template Creation:** Generate templates from existing products for easy bulk creation.
- **Bulk Product Creation:** Create multiple products simultaneously using predefined templates.
- **Secure API Key Handling:** Ensures the safe storage and management of user API keys.
- **User-Friendly Interface:** Intuitive design for managing products and templates.

---

## Updated Project Outline with Essential Enhancements

### Primary Goal

Enable the ability to easily and efficiently bulk create new Printify products using the Printify API through the **SiP Printify Manager** WordPress plugin.

### High-Level Workflow

1. **User Authentication**
   - **User enters API Key**
     - **UX and Functionality:** Complete
     - **Enhancements:**
       - **API Key Handling:** Encrypt the user's Printify API key before storing it in the database to ensure security.
       - **Authentication:** Implement nonce verification and capability checks to protect API endpoints and plugin settings.

2. **Data Retrieval**
   - **The Manager uses the API to return the user's Printify Store (`GET /v1/shops.json`) and its Products (`GET /v1/shops/{shop_id}/products.json`).**
     - **UX and Functionality:** Complete
     - **Enhancements:**
       - **Error Handling:** Implement comprehensive error handling for API call failures, including user-friendly error messages.

3. **Product Listing**
   - **The products are listed in the plugin interface.**
     - **UX and Functionality:** Complete
     - **Enhancements:**
       - **User Interface:** Ensure the product list is responsive and handles large datasets gracefully.

4. **Template Creation**
   - **Option to create templates from the retrieved products.**
     - **UX and Functionality:** Complete
     - **Enhancements:**
       - **Template Editing:** Allow basic editing of templates after creation to fix minor issues.
       - **Data Validation:** Validate the data extracted from products to ensure compatibility with the Printify API.

5. **Template Optimization**
   - **The files created are optimized to be used in the plugin's product creation functionality.**
     - **Development Required:** Details to follow.
     - **Enhancements:**
       - **Data Sanitization:** Sanitize all data within templates to prevent security vulnerabilities like SQL injection or XSS attacks.

6. **Bulk Product Creation**
   - **Templates can be used to bulk create large quantities of new products through the Printify API.**
     - **Enhancements:**
       - **Asynchronous Processing:** Utilize background processing (e.g., WP Background Processing) to handle bulk product creation without causing server timeouts.
       - **Progress Indicators:** Implement progress bars or status indicators to inform users of ongoing operations.
       - **Error Handling:** Provide detailed feedback for each product creation attempt, highlighting successes and failures.

### Template Creation from Product Data

- **Purpose:** Represent the necessary data to use the Printify Product Creation API (`POST /v1/shops/{shop_id}/products.json`) to create a new product.
- **Process:**
  1. **Select Source Product:** Any product listed in the plugin can be selected to create a template.
  2. **Execute Create Template Action:**
     - Run a Python script on the selected product’s `.json` to strip unnecessary data (e.g., `id`, `options`, `images`, etc.).
     - Retain certain keys (e.g., `tags`) for template flexibility.
     - Convert product data into variables (e.g., `image_01`, `text_01`) for easy swapping during product creation.
  3. **Store Template:**
     - Permanently store the template, ensuring it’s encrypted and securely saved for user access.

### Product Creation Using Templates

1. **Select Template:**
   - User selects a template and executes the create product requests action.

2. **Data Entry Table:**
   - **Fields:**
     - **Title**
     - **Tags**
     - **URL of Image to Swap in for Main Design**
     - **Text to Swap in for Main Text**
   - **Dynamic Headers:**
     - Based on template variables (e.g., `Title | Tags | Image_01 URL | Image_02 URL | Text_01 | Text_02`).
   - **Add Rows:**
     - Button to add new rows for additional products.

3. **Execute Bulk Creation:**
   - **Asynchronous Processing:** Queue product creation requests using background jobs.
   - **Progress Indicators:** Display real-time progress and status updates.
   - **Error Feedback:** Provide detailed feedback for each product creation attempt.

---

## Backlog: Prioritized Improvements and Enhancements

### 1. Security Enhancements (High Priority)

- **Enhanced Encryption:** Implement advanced encryption standards for storing sensitive data beyond the initial API key encryption.
- **Two-Factor Authentication (2FA):** Introduce 2FA for accessing the plugin settings to add an extra layer of security.

### 2. Robust Error Handling and Logging (High Priority)

- **Comprehensive Logging:** Maintain detailed logs of all API interactions for auditing and debugging purposes.
- **Retry Mechanism:** Implement automatic retries for transient API failures (e.g., network issues).

### 3. Scalability and Performance Optimization (High Priority)

- **Efficient Data Handling:** Optimize data structures and database queries to handle large datasets efficiently.
- **Caching Strategies:** Implement caching for API responses to reduce redundant calls and improve responsiveness.

### 4. User Interface Enhancements (Medium Priority)

- **Drag-and-Drop Interface:** Allow users to drag and drop products to create templates, enhancing usability.
- **Bulk Editing:** Enable users to edit multiple templates or product entries simultaneously for efficiency.

### 5. Advanced Template Features (Medium Priority)

- **Custom Template Variables:** Allow users to define and use custom variables within templates for greater flexibility.
- **Conditional Logic:** Enable conditional elements within templates to handle products with varying attributes or options.

### 6. Data Validation and Sanitization (Medium Priority)

- **Advanced Validation Rules:** Implement more sophisticated validation rules to ensure all data meets Printify’s API requirements.
- **Real-Time Sanitization:** Sanitize inputs in real-time as users enter data to prevent security issues proactively.

### 7. Comprehensive Documentation and Support (Low Priority)

- **In-Plugin Tutorials:** Develop step-by-step guides within the plugin to assist users in setup and usage.
- **FAQ and Troubleshooting:** Create a comprehensive FAQ section addressing common issues and solutions.
- **Support Channels:** Establish support via email, forums, or a ticketing system for user assistance.

### 8. Compatibility and Testing (Low Priority)

- **Cross-Version Compatibility:** Ensure compatibility with a wider range of WordPress versions and regularly test with updates.
- **Plugin Conflict Testing:** Identify and resolve potential conflicts with popular WordPress plugins to ensure seamless integration.

### 9. Analytics and Reporting (Low Priority)

- **Usage Statistics:** Provide users with insights into their bulk product creation activities (e.g., number of products created, templates used).
- **Performance Metrics:** Track and display plugin performance metrics to identify and optimize bottlenecks.

---

## Implementation Prioritization Summary

1. **Security Enhancements:** Ensure the plugin securely handles user data and API keys from the outset.
2. **Error Handling and Logging:** Implement robust mechanisms to handle and log errors effectively.
3. **Scalability and Performance Optimization:** Optimize the plugin to handle bulk operations smoothly.
4. **User Interface Enhancements:** Improve usability to streamline the template creation and bulk product processes.
5. **Advanced Template Features:** Add flexibility and customization options to templates.
6. **Data Validation and Sanitization:** Enhance data integrity and security through advanced validation.
7. **Comprehensive Documentation and Support:** Provide resources to assist users in using the plugin effectively.
8. **Compatibility and Testing:** Ensure the plugin works reliably across different environments and setups.
9. **Analytics and Reporting:** Offer insights and performance data to users for better management.

---

## Next Steps

1. **Integrate Essential Enhancements:**
   - Implement API key encryption and secure storage.
   - Add nonce verification and capability checks for all plugin actions.
   - Develop comprehensive error handling with user-friendly messages.
   - Set up background processing for bulk operations with progress indicators.
   - Validate and sanitize all user inputs during template creation and product creation.

2. **Develop Core Functionality:**
   - Finalize the template creation and optimization processes.
   - Implement the bulk product creation workflow using templates.

3. **Test Core Features:**
   - Conduct thorough testing to ensure the core functionalities work seamlessly.
   - Validate security measures and error handling mechanisms.

4. **Prepare for Initial Deployment:**
   - Ensure the plugin is compatible with your current WordPress setup.
   - Backup existing data and configurations before deploying the plugin.

5. **Plan for Backlog Implementation:**
   - Use the prioritized backlog to schedule and implement additional features and improvements incrementally.

---

## Contact & Support

For further assistance or inquiries, please reach out through [your preferred contact method, e.g., email, support forum, etc.].

---

