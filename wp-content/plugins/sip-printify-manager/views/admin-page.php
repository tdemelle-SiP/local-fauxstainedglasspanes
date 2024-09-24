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
<div class="header-section">
    <h1 class="header-title"><?php esc_html_e('Welcome to SIP Printify Manager!', 'sip-printify-manager'); ?></h1>
    <div id="button-container" <?php echo empty($token) ? 'style="display:none;"' : ''; ?>>
        <button id="new-token-button" class="button button-primary"><?php esc_html_e('New Store Token', 'sip-printify-manager'); ?></button>
    </div>
</div>

<!-- Spinner Overlay -->
<div id="spinner-overlay" style="display: none;">
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
        <li>Once saved, we'll connect to your shop and retrieve your image uploads abd product list. From there, you'll be able to manage your Printify products and create new ones right from your WordPress dashboard!</li>
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
                <input type="text" id="product-search" placeholder="<?php esc_attr_e('Search Products...', 'sip-printify-manager'); ?>" style="margin-left: auto;">
            </h2>
            <form id="product-action-form" class="product-action-form" method="post" action="">
                <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                <label for="product_action"><?php esc_html_e('Product Actions:', 'sip-printify-manager'); ?> </label>
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
                <input type="text" id="template-search" placeholder="<?php esc_attr_e('Search Templates...', 'sip-printify-manager'); ?>" style="margin-left: auto;">
            </h2>
            <form id="template-action-form" method="post" action="">
                <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                <label for="template_action"><?php esc_html_e('Template Actions:', 'sip-printify-manager'); ?> </label>
                <select name="template_action" id="template_action">
                    <option value="delete_template"><?php esc_html_e('Delete Template', 'sip-printify-manager'); ?></option>
                </select>
                <input type="submit" name="execute_template_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary"/>
            </form>

            <!-- Ensure the container itself doesn't scroll -->
            <div id="template-list-container" class="template-list-container">
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
    </div>

    <!-- Right Column: Images -->
    <div id="images-section" class="images-section">
        <h2 style="display: flex; justify-content: space-between; align-items: center;">
            <?php esc_html_e('Images', 'sip-printify-manager'); ?>
            <input type="text" id="image-search" placeholder="<?php esc_attr_e('Search Images...', 'sip-printify-manager'); ?>" style="margin-left: auto;">
        </h2>
        <form id="image-action-form" class="image-action-form" method="post" action="">
            <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
            <label for="image_action"><?php esc_html_e('Image Actions:', 'sip-printify-manager'); ?> </label>
            <select name="image_action" id="image_action">
                <option value="reload_shop_images"><?php esc_html_e('Reload Shop Images', 'sip-printify-manager'); ?></option>
                <option value="remove_from_manager"><?php esc_html_e('Remove from Manager', 'sip-printify-manager'); ?></option>
                <option value="add_to_new_product"><?php esc_html_e('Add to New Product', 'sip-printify-manager'); ?></option>
                <option value="upload_to_shop"><?php esc_html_e('Upload to Shop', 'sip-printify-manager'); ?></option>
                <option value="archive_shop_image"><?php esc_html_e('Archive Shop Image', 'sip-printify-manager'); ?></option>
            </select>
            <input type="submit" name="execute_image_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary" />
        </form>
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
        <!-- Drag and Drop Area -->
        <div id="image-upload-area" class="image-upload-area">
            <p><?php esc_html_e('Drag and drop images here to upload, or', 'sip-printify-manager'); ?></p>
            <button id="select-images-button" class="button button-primary"><?php esc_html_e('Select Images', 'sip-printify-manager'); ?></button>
            <input type="file" id="image-file-input" accept=".jpg,.jpeg,.png,.webp,.svg" multiple style="display: none;">
        </div>
    </div>
</div>

        <!-- End of Products, Templates, and Images Section -->
    <?php else : ?>
        <h2><?php esc_html_e('Shop could not be loaded. Please try re-authorizing.', 'sip-printify-manager'); ?></h2>
    <?php endif; ?>
</div>

<textarea id="template-editor-textarea" name="template_content" rows="20" cols="100"><?php echo esc_textarea($template_content); ?></textarea>



<div id="product-creation-container" <?php echo !empty($token) ? '' : 'style="display:none;"'; ?>>
    <hr class="divider" style="margin-top: 20px; background-color: #c0bfbf;">
    <h2 class="creation-table-title"><?php esc_html_e('Product Creation Table', 'sip-printify-manager'); ?></h2>
</div>