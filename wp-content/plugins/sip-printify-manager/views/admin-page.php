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
<div id="spinner-overlay">
    <img id="spinner" src="<?php echo esc_url($sip_core_assets_url . '/images/spinner.webp'); ?>" alt="<?php esc_attr_e('Loading...', 'sip-printify-manager'); ?>">
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

        <div id="products-templates-image-container" class="products-templates-image-container">
            <!-- Left Column: Templates and Products -->
            <div id="left-column" class="left-column">

                <!-- Products Section -->
                <div id="products-section" class="products-section">
                    <div id="products-section-header" class="products-section-header">
                        <h2>
                            <?php esc_html_e('Products', 'sip-printify-manager'); ?>
                            <label for="product-search" class="screen-reader-text"><?php esc_html_e('Search Products', 'sip-printify-manager'); ?></label>
                            <input type="text" id="product-search" placeholder="<?php esc_attr_e('Search Products...', 'sip-printify-manager'); ?>">
                        </h2>
                        <form id="product-action-form" class="product-action-form" method="post" action="">
                            <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                            <label for="product_action" class="screen-reader-text"><?php esc_html_e('Product Actions', 'sip-printify-manager'); ?></label>
                            <select name="product_action" id="product_action">
                                <option value="create_template"><?php esc_html_e('Create Template', 'sip-printify-manager'); ?></option>
                                <option value="remove_from_manager"><?php esc_html_e('Remove from Manager', 'sip-printify-manager'); ?></option>                                    
                                <option value="reload"><?php esc_html_e('Reload', 'sip-printify-manager'); ?></option>
                            </select>
                            <input type="submit" name="execute_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary" />
                        </form>
                    </div>
                    <div id="product-table-list" class="product-table-list">
                        <?php echo sip_display_product_list($products); ?>
                    </div>
                </div> <!-- End of products-section -->

                <!-- Template Section -->
                <div id="template-section" class="template-section">
                    <div id="template-section-header" class="template-section-header">
                        <h2>
                            <?php esc_html_e('Templates', 'sip-printify-manager'); ?>
                            <label for="template-search" class="screen-reader-text"><?php esc_html_e('Search Templates', 'sip-printify-manager'); ?></label>
                            <input type="text" id="template-search" placeholder="<?php esc_attr_e('Search Templates...', 'sip-printify-manager'); ?>">
                        </h2>
                        <form id="template-action-form" class="template-action-form" method="post" action="">
                            <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                            <label for="template_action" class="screen-reader-text"><?php esc_html_e('Template Actions', 'sip-printify-manager'); ?></label>
                            <select name="template_action" id="template_action">
                                <option value="create_new_products"><?php esc_html_e('Create New Products', 'sip-printify-manager'); ?></option>
                                <option value="delete_template"><?php esc_html_e('Delete Template', 'sip-printify-manager'); ?></option>
                            </select>
                            <input type="submit" name="execute_template_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary"/>
                        </form>
                    </div>    
                    <div id="template-table-list" class="template-table-list">
                        <?php echo sip_display_template_list($templates); ?>
                    </div>
                </div> <!-- End of template-section -->
            </div> <!-- End of templates-products-column -->

            <!-- Right Column: Image -->
            <div id="right-column" class="right-column">
                <div id="image-section" class="image-section">
                    <div id="image-section-header" class="image-section-header">
                        <div id="image-header-left" class="image-header-left">
                            <div id="image-header-left-top" class="image-header-left-top">
                                <h2><?php esc_html_e('Images', 'sip-printify-manager'); ?>
                                    <label for="image-search" class="screen-reader-text"><?php esc_html_e('Search Images', 'sip-printify-manager'); ?></label>
                                    <input type="text" id="image-search" placeholder="<?php esc_attr_e('Search Images...', 'sip-printify-manager'); ?>">     
                                </h2>                   
                            </div> <!-- End of image-header-left-top -->
                            <div id="image-header-left-bottom" class="image-header-left-bottom">
                                <form id="image-action-form" class="image-action-form" method="post" action="">
                                    <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                                    <label for="image_action" class="screen-reader-text"><?php esc_html_e('Image Actions', 'sip-printify-manager'); ?></label>
                                    <select name="image_action" id="image_action">
                                        <option value="add_to_new_product"><?php esc_html_e('Add to New Product', 'sip-printify-manager'); ?></option>
                                        <option value="upload_to_shop"><?php esc_html_e('Upload to Shop', 'sip-printify-manager'); ?></option>
                                        <option value="remove_from_manager"><?php esc_html_e('Remove from Manager', 'sip-printify-manager'); ?></option>
                                        <option value="reload_shop_images"><?php esc_html_e('Reload Shop Images', 'sip-printify-manager'); ?></option>
                                        <option value="archive_shop_images"><?php esc_html_e('Archive Shop Image', 'sip-printify-manager'); ?></option>
                                    </select>
                                    <input type="submit" name="execute_image_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary" />
                                </form>
                            </div> <!-- End of image-header-left-bottom -->
                        </div> <!-- End of image-header-left -->
                        <div id="image-header-right" class="image-header-right">
                            <div id="image-upload-area" class="image-upload-area">
                                <label for="image-file-input" class="screen-reader-text"><?php esc_html_e('Select Images to Upload', 'sip-printify-manager'); ?></label>
                                <p><?php esc_html_e('Drag and drop images here to upload', 'sip-printify-manager'); ?></p>
                                <p><?php esc_html_e('or', 'sip-printify-manager'); ?></p>
                                <button id="select-images-button" class="button button-primary"><?php esc_html_e('Select Images', 'sip-printify-manager'); ?></button>
                                <input type="file" id="image-file-input" accept=".jpg,.jpeg,.png,.webp,.svg" multiple style="display: none;">
                            </div> <!-- End of image-upload-area -->
                        </div> <!-- End of image-header-right -->
                    </div> <!-- End of image-header -->
                    <div id="image-table-list">
                        <?php 
                        if (!empty($images)) {
                            echo sip_display_image_list($images);
                        } else {
                            ?>
                            <div id="no-images-found" style="padding: 10px;">
                                <p><?php esc_html_e('No images loaded.', 'sip-printify-manager'); ?></p>
                                <form id="reload-shop-images-form" method="post">
                                    <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                                    <input type="hidden" name="action" value="sip_handle_ajax_request">
                                    <input type="hidden" name="action_type" value="image_action">
                                    <input type="hidden" name="image_action" value="reload_shop_images">
                                    <input type="hidden" name="nonce" value="<?php echo wp_create_nonce('sip_printify_manager_nonce'); ?>">
                                    <button type="button" id="reload-images-button" class="button button-primary">
                                        <?php esc_html_e('Reload Shop Images', 'sip-printify-manager'); ?>
                                    </button>
                                </form>
                            </div>
                            <?php
                        }
                        ?>
                    </div> <!-- End of image-table-list -->

                </div> <!-- End of image-section -->
            </div> <!-- End of right-column -->

        </div> <!-- End of products-templates-image-container -->

    <?php else : ?>
        <h2><?php esc_html_e('Shop could not be loaded. Please try re-authorizing.', 'sip-printify-manager'); ?></h2>
    <?php endif; ?>
</div> <!-- End of shop-container -->

<!-- The Toast -->
<div id="toast-container"></div>

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
    <hr class="divider">
        <!-- Product Table Header -->
        <div id="creation-header" class="creation-header">
            <div class="header-buttons">
                <button id="close-template" class="button"><?php esc_html_e('Close', 'sip-printify-manager'); ?></button>
                <button id="save-template" class="button"><?php esc_html_e('Save', 'sip-printify-manager'); ?></button>
                <button id="edit-json" class="button"><?php esc_html_e('Edit JSON', 'sip-printify-manager'); ?></button>

            </div>
            <div class="creation-header-titles">
                <h2 class="creation-table-title"><?php esc_html_e('Product Creation Table', 'sip-printify-manager'); ?></h2>
                <h3><span id="selected-template-name"></span></h3>
            </div>
            <div class="import-export">
                <button id="import-csv" class="button">Import CSV</button>
                <button id="export-csv" class="button">Export CSV</button>
                <button id="create-product-button" class="button button-primary">Create Product</button>
            </div>
        </div>
        <hr class="divider">
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
    </section>
</div>