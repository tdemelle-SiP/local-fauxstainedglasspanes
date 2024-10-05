<?php
/**
 * Admin Page View for SiP Printify Manager
 *
 * This file contains the HTML and PHP code for rendering the admin page of the SiP Printify Manager plugin.
 */
 
// Prevent direct access for security
if (!defined('ABSPATH')) exit;

// Retrieve necessary data
$token      = get_option('printify_bearer_token');
$shop_name  = get_option('sip_printify_shop_name');
$products   = get_option('sip_printify_products');
$images     = get_option('sip_printify_images'); // Fetch images from options
$local_images = get_option('sip_local_images', array()); // Fetch local images
$templates  = sip_load_templates();

// Get the URL to the sip-plugins-core assets directory
$sip_core_assets_url = plugins_url('sip-plugins-core/assets');
?>

<!-- Header Section -->
<link rel="preload" href="<?php echo esc_url($sip_core_assets_url . '/images/spinner.webp'); ?>" as="image">
<div class="header-section">
    <h1 class="header-title"><?php esc_html_e('Welcome to SIP Printify Manager!', 'sip-printify-manager'); ?></h1>
    <div id="button-container" <?php echo empty($token) ? 'style="display:none;"' : ''; ?>>
        <button id="new-token-button" class="button button-primary"><?php esc_html_e('New Shop Token', 'sip-printify-manager'); ?></button>
    </div>
</div>

<!-- Spinner Overlay -->
<div id="spinner-overlay" style="display: flex; justify-content: center; align-items: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 9999;">
    <img id="spinner" src="<?php echo esc_url($sip_core_assets_url . '/images/spinner.webp'); ?>" alt="<?php esc_attr_e('Loading...', 'sip-printify-manager'); ?>" style="width: 50px; height: 50px;">
</div>


<!-- Auth Container for Token Entry -->
<div id="auth-container" <?php echo empty($token) ? '' : 'style="display:none;"'; ?>>
    <h2><?php esc_html_e("To Begin, Please Enter Your Authorization Token From Printify.", 'sip-printify-manager'); ?></h2>
    <ol>
        <li>To get your token, log in to your Printify account and navigate to the <a href="https://printify.com/app/account/api" target="_blank">Connections</a> page.</li>
        <li>Provide a contact email in the "API Access" section where you would like to receive connection-related notifications.</li>
        <li>Click the <strong>Generate</strong> button to create a new Authorization Token</li>
        <li>Name your token (e.g., "Printify Manager Token") and select :All scopes (full access).</li>
        <li>Click <strong>Generate token</strong> and then Click <strong>Copy to clipboard</strong>.</li>
        <li>Paste the token below and click <strong>Save Token</strong>.</li>
        <li>Once saved, we'll connect to your shop and retrieve your image uploads and product list. From there, you'll be able to manage your Printify products and create new ones right from your WordPress dashboard!</li>
    </ol>
    <p><strong>Note:</strong> It's a good idea to save the token somewhere you can access it later in case you need to re-authorize the plugin. If you lose the token, don't worry, you can just follow these steps again to generate a new one.</p>
    <form id="save-token-form" method="post" action="">
        <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
        <h2>
            <label for="printify_bearer_token"><?php esc_html_e('Printify API Token:', 'sip-printify-manager'); ?></label>
            <input type="text" name="printify_bearer_token" id="printify_bearer_token" value="" class="regular-text" required/>
            <input type="submit" name="save_token" value="<?php esc_attr_e('Save Token', 'sip-printify-manager'); ?>" class="button button-primary"/>
        </h2>
        <hr class="divider">
    </form>
</div>

<!-- Shop Screen (only show if token exists) -->
<div id="shop-container" <?php echo !empty($token) ? '' : 'style="display:none;"'; ?>>
    <hr class="divider">
    <?php if (!empty($shop_name)) : ?>
        <!-- Store Name Section -->
        <h2 class="shop-name">
            <a href="https://printify.com/app/store/products/1" target="_blank">
                <?php echo esc_html($shop_name); ?>
            </a>
        </h2>

        <div id="products-templates-images-container" class="products-templates-images-container">
    
    <!-- Left Column: Templates and Products -->
    <div id="templates-products-column" class="templates-products-column">

        <!-- Products Section -->
        <div id="products-section" class="products-section">
            <h2 style="display: flex; justify-content: space-between; align-items: center;">
                <?php esc_html_e('Products', 'sip-printify-manager'); ?>
                <input type="text" id="product-search" placeholder="<?php esc_attr_e('Search Products...', 'sip-printify-manager'); ?>">
            </h2>
            <form id="product-action-form" class="product-action-form" method="post" action="">
                <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                <select name="product_action" id="product_action">
                    <option value="reload"><?php esc_html_e('Reload', 'sip-printify-manager'); ?></option>
                    <option value="create_template"><?php esc_html_e('Create Template', 'sip-printify-manager'); ?></option>
                    <option value="remove_from_manager"><?php esc_html_e('Remove from Manager', 'sip-printify-manager'); ?></option>
                </select>
                <input type="submit" name="execute_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary" />
            </form>
            <div id="product-list" class="product-list">
                <?php 
                if (!empty($products)) {
                    sip_display_product_list($products);
                } else {
                    echo '<p>' . esc_html__('No products found.', 'sip-printify-manager') . '</p>';
                }
                ?>
            </div>
        </div>

        <!-- Template Section -->
        <div id="template-container" class="template-container">
            <h2 style="display: flex; justify-content: space-between; align-items: center;">
                <?php esc_html_e('Templates', 'sip-printify-manager'); ?>
                <input type="text" id="template-search" placeholder="<?php esc_attr_e('Search Templates...', 'sip-printify-manager'); ?>">
            </h2>
            <form id="template-action-form" class="template-action-form"  method="post" action="">
                <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                <select name="template_action" id="template_action">

                    <option value="create_new_products"><?php esc_html_e('Create New Products', 'sip-printify-manager'); ?></option>
                    <option value="delete_template"><?php esc_html_e('Delete Template', 'sip-printify-manager'); ?></option>
                    <!-- Other options -->
                </select>
                <input type="submit" name="execute_template_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary"/>
            </form>
            <!-- Ensure the container itself doesn't scroll -->
            <!-- The inner div that will scroll -->
            <div id="template-list" class="template-list">
                <?php 
                if (!empty($templates)) {
                    sip_display_template_list($templates);
                } else {
                    echo '<p>' . esc_html__('No templates found.', 'sip-printify-manager') . '</p>';
                }
                ?>
            </div>
        </div>
    </div>

    <!-- Right Column: Images -->
    <div id="images-column" class="images-column">

        <div id="images-section" class="images-section">
            <div id="images-header" class="images-header">
                <div id= "images-header-left" class="images-header-left">
                    <div id="images-header-left-top" class="images-header-left-top">
                        <h2><?php esc_html_e('Images', 'sip-printify-manager'); ?></h2>
                        <input type="text" id="image-search" placeholder="<?php esc_attr_e('Search Images...', 'sip-printify-manager'); ?>">                        
                    </div>
                    <div id="imagees-header-left-bottom" class="images-header-left-bottom">
                        <form id="image-action-form" class="image-action-form" method="post" action="">
                            <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                            <select name="image_action" id="image_action">
                                <option value="reload_shop_images"><?php esc_html_e('Reload Shop Images', 'sip-printify-manager'); ?></option>
                                <option value="remove_from_manager"><?php esc_html_e('Remove from Manager', 'sip-printify-manager'); ?></option>
                                <option value="add_to_new_product"><?php esc_html_e('Add to New Product', 'sip-printify-manager'); ?></option>
                                <option value="upload_to_shop"><?php esc_html_e('Upload to Shop', 'sip-printify-manager'); ?></option>
                                <option value="archive_shop_image"><?php esc_html_e('Archive Shop Image', 'sip-printify-manager'); ?></option>
                            </select>
                            <input type="submit" name="execute_image_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary" />
                        </form>
                    </div>
                </div>
                <div id="images-header-right" class="images-header-right">
                    <div id="image-upload-area" class="image-upload-area">
                        <p><?php esc_html_e('Drag and drop images here to upload, or', 'sip-printify-manager'); ?></p>
                        <button id="select-images-button" class="button button-primary"><?php esc_html_e('Select Images', 'sip-printify-manager'); ?></button>
                        <input type="file" id="image-file-input" accept=".jpg,.jpeg,.png,.webp,.svg" multiple style="display: none;">
                    </div>
                </div>
            </div>
            <div id="image-list">
                <?php 
                $images = get_option('sip_printify_images', array());
                if (!empty($images)) {
                    sip_display_image_list($images);
                } else {
                    echo '<p>' . esc_html__('No images found.', 'sip-printify-manager') . '</p>';
                }
                ?>
            </div>
        </div>
    </div>
</div>

        <!-- End of Products, Templates, and Images Section -->
    <?php else : ?>
        <h2><?php esc_html_e('Shop could not be loaded. Please try re-authorizing.', 'sip-printify-manager'); ?></h2>
    <?php endif; ?>
</div>


<!-- The Template Editor Modal -->
<div id="template-editor-overlay" class="template-editor-overlay">
    <div id="template-editor-outer-window">
        <div id="template-editor-header">
            <span>Template Editor</span>
            <div class="header-buttons">
                <button id="template-editor-save">Save</button>
                <button id="template-editor-close">Close</button>
            </div>
        </div>
        <div id="template-editor-inner-container">
            <div id="template-editor-top-container">
                <div id="template-editor-top-wrapper">
                    <div id="template-editor-description-header">
                        <span>Product Description</span>
                        <button id="template-editor-toggle-view">View Rendered</button>
                    </div>
                    <div id="template-editor-top-editor"></div>
                    <div id="template-editor-rendered-html"></div>
                </div>
            </div>
            <div id="template-editor-resizer"></div>
            <div id="template-editor-bottom-container">
                <div id="template-editor-bottom-wrapper">
                    <div id="template-editor-json-header">
                        <span>Product JSON</span>
                    </div>
                    <div id="template-editor-bottom-editor"></div>
                </div>
            </div>
        </div>
    </div>
</div>


<!-- Product Creation Table Section -->
<div id="product-creation-container" <?php echo !empty($token) ? '' : 'style="display:none;"'; ?>>

    <!-- Product Creation Header and Main Controls -->
    <section id="product-creation-table" class="sip-section">
    <hr class="divider" style="margin-top: 20px; background-color: #c0bfbf;">
    <h2 class="creation-table-title"><?php esc_html_e('Product Creation Table', 'sip-printify-manager'); ?></h2>

        <!-- Product Table Header -->
        <div id="creation-header" class="creation-header" style="justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div class="template-name" style="flex: 1; text-align: center;">
                <h3><?php esc_html_e('Template:', 'sip-printify-manager'); ?> <span id="selected-template-name"></span></h3>
            </div>
            <div class="header-buttons" style="flex: 1; text-align: right;">
                <button id="edit-json" class="button"><?php esc_html_e('Edit JSON', 'sip-printify-manager'); ?></button>
                <button id="save-template" class="button"><?php esc_html_e('Save', 'sip-printify-manager'); ?></button>
                <button id="close-template" class="button"><?php esc_html_e('Close', 'sip-printify-manager'); ?></button>
            </div>
        </div>

        <!-- Dynamic Product Table -->
        <table id="creation-table" class="wp-list-table widefat fixed striped">
            <!-- Table headers and rows will be populated dynamically -->
            <thead>
            <!-- Headers will be inserted here by JavaScript -->
            </thead>
            <tbody>
            <!-- Rows will be inserted here by JavaScript -->
            </tbody>
        </table>
        <div class="footer-controls">
            <div class="import-export">
                <button id="import-csv" class="button">Import CSV</button>
                <button id="export-csv" class="button">Export CSV</button>
            </div>
            <button id="create-product-button" class="button button-primary">Create Product</button>
        </div>
    </section>
</div>

