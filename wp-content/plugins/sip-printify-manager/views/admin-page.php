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

// Alternatively, if the sip-plugins-core plugin defines a constant or function to get its assets URL, use that.
?>
<!-- Header Section -->
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <h1 style="margin: 0;"><?php esc_html_e('Welcome to SIP Printify Manager!', 'sip-printify-manager'); ?></h1>
    <div id="button-container" <?php echo empty($token) ? 'style="display:none;"' : ''; ?>>
        <!-- Removed Re-authorize Button -->
        <button id="new-token-button" class="button button-primary"><?php esc_html_e('New Store Token', 'sip-printify-manager'); ?></button>
    </div>
</div>
        <hr style="height: 1px; background-color: #000;">

        <!-- Spinner Overlay -->
        <div id="spinner-overlay" style="display: none;">
            <img id="spinner" src="<?php echo esc_url($sip_core_assets_url . '/images/spinner.webp'); ?>" alt="<?php esc_attr_e('Loading...', 'sip-printify-manager'); ?>">
        </div>

        <!-- Auth Container for Token Entry -->
        <div id="auth-container" <?php echo empty($token) ? '' : 'style="display:none;"'; ?>>
            <h2><?php esc_html_e("To Begin, We'll Connect To Your Account Using A Code From Printify.", 'sip-printify-manager'); ?></h2>
            <ol>
                <!-- Instructions omitted for brevity -->
            </ol>
            <p><strong>Note:</strong> It's a good idea to save the token somewhere you can access it later in case you need to re-authorize the plugin. If you lose the token, don't worry, you can just follow these steps again to generate a new one.</p>           

            <form id="save-token-form" method="post" action="">
                <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                <h2>
                    <label for="printify_bearer_token"><?php esc_html_e('Printify API Token:', 'sip-printify-manager'); ?></label>
                    <input type="text" name="printify_bearer_token" id="printify_bearer_token" value="" class="regular-text" required/>
                    <input type="submit" name="save_token" value="<?php esc_attr_e('Save Token', 'sip-printify-manager'); ?>" class="button button-primary"/>
                    <img id="spinner" src="<?php echo esc_url($sip_core_assets_url . '/images/spinner.webp'); ?>" style="display: none; width: 20px; height: 20px; vertical-align: middle; margin-left: 10px;">
                </h2>
                <hr style="height: 1px; background-color: #000;">
            </form>
        </div>

<!-- Shop Screen (only show if token exists) -->
<div id="shop-container" <?php echo !empty($token) ? '' : 'style="display:none;"'; ?>>
    <?php if (!empty($shop_name)) : ?>
        <h2 style="text-align: center; font-weight: bold; font-size: 54px; color: #0273AB; text-transform: uppercase;">
            <a href="https://printify.com/app/store/products/1" target="_blank" style="color: inherit; text-decoration: none;">
                <?php echo esc_html($shop_name); ?>
            </a>
        </h2>
        <hr style="height: 1px; background-color: #000;">
        <!-- Products and Images Section -->
        <div id="products-images-container" style="display: flex; justify-content: space-between;">
            <!-- Products Section -->
            <div id="products-section" style="width: 40%; padding-right: 10px;">
                <h2><?php esc_html_e('Products', 'sip-printify-manager'); ?></h2>
                <form id="product-action-form" style="display: flex; align-items: center;" method="post" action="">
                    <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                    <label for="product_action"><?php esc_html_e('Product Actions:', 'sip-printify-manager'); ?> </label>
                    <select name="product_action" id="product_action">
                        <option value="reload"><?php esc_html_e('Reload', 'sip-printify-manager'); ?></option>
                        <option value="create_template"><?php esc_html_e('Create Template', 'sip-printify-manager'); ?></option>
                        <option value="remove_from_manager"><?php esc_html_e('Remove from Manager', 'sip-printify-manager'); ?></option>
                    </select>
                    <input type="submit" name="execute_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary" style="margin-left: 10px;" />
                </form>
                <div id="product-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
                    <?php 
                    if (!empty($products)) {
                        sip_display_product_list($products);
                    } else {
                        echo '<p>' . esc_html__('No products found.', 'sip-printify-manager') . '</p>';
                    }
                    ?>
                </div>
            </div>

            <!-- Images Section -->
            <div id="images-section" style="width: 60%; padding-left: 10px;">
                <h2><?php esc_html_e('Images', 'sip-printify-manager'); ?></h2>
                <form id="image-action-form" style="display: flex; align-items: center;" method="post" action="">
                    <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                    <label for="image_action"><?php esc_html_e('Image Actions:', 'sip-printify-manager'); ?> </label>
                    <select name="image_action" id="image_action">
                        <option value="reload_shop_images"><?php esc_html_e('Reload Shop Images', 'sip-printify-manager'); ?></option>
                        <option value="remove_from_manager"><?php esc_html_e('Remove from Manager', 'sip-printify-manager'); ?></option>
                        <option value="add_to_new_product"><?php esc_html_e('Add to New Product', 'sip-printify-manager'); ?></option>
                        <option value="upload_to_shop"><?php esc_html_e('Upload to Shop', 'sip-printify-manager'); ?></option>
                        <option value="archive_shop_image"><?php esc_html_e('Archive Shop Image', 'sip-printify-manager'); ?></option>
                    </select>
                    <input type="submit" name="execute_image_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary" style="margin-left: 10px;" />
                </form>
                <div id="image-list" style="overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
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
                <div id="image-upload-area" style="margin-top: 10px; border: 2px dashed #ccc; padding: 20px; text-align: center;">
                    <p><?php esc_html_e('Drag and drop images here to upload, or', 'sip-printify-manager'); ?></p>
                    <button id="select-images-button" class="button button-primary"><?php esc_html_e('Select Images', 'sip-printify-manager'); ?></button>
                    <input type="file" id="image-file-input" accept=".jpg,.jpeg,.png,.webp,.svg" multiple style="display: none;">
                </div>
            </div>
        </div>
        <!-- End of Products and Images Section -->
    <?php else : ?>
        <h2><?php esc_html_e('Shop could not be loaded. Please try re-authorizing.', 'sip-printify-manager'); ?></h2>
    <?php endif; ?>
</div>

        <!-- Template Section -->
        <div id="template-container" <?php echo !empty($templates) && !empty($token) ? '' : 'style="display:none;"'; ?>>
            <hr style="height: 1px; background-color: #000;">
            <h2><?php esc_html_e('Templates', 'sip-printify-manager'); ?></h2>
            <form id="template-action-form" method="post" action="">
                <?php wp_nonce_field('sip_printify_manager_nonce', 'sip_printify_manager_nonce_field'); ?>
                <label for="template_action"><?php esc_html_e('Template Actions:', 'sip-printify-manager'); ?> </label>
                <select name="template_action" id="template_action">
                    <option value="delete_template"><?php esc_html_e('Delete Template', 'sip-printify-manager'); ?></option>
                    <option value="rename_template"><?php esc_html_e('Rename Template', 'sip-printify-manager'); ?></option>
                    <option value="edit_template"><?php esc_html_e('Edit Template', 'sip-printify-manager'); ?></option>
                </select>
                <input type="submit" name="execute_template_action" value="<?php esc_attr_e('Execute', 'sip-printify-manager'); ?>" class="button button-secondary"/>

                <!-- Rename Template Input -->
                <div id="rename-template-input" style="display: none; margin-top: 10px;">
                    <input type="text" name="new_template_name" placeholder="<?php esc_attr_e('New template name', 'sip-printify-manager'); ?>">
                </div>
            </form>
            <div id="template-list">
                <?php 
                sip_display_template_list($templates); 
                ?>
            </div>
            <div id="template-editor" style="display: none; margin-top: 20px;">
                <h3><?php esc_html_e('Edit Template:', 'sip-printify-manager'); ?> <span id="editing-template-name"></span></h3>
                <textarea id="template-content" rows="20" style="width: 100%;"></textarea>
                <div style="margin-top: 10px;">
                    <button id="close-editor" class="button"><?php esc_html_e('Close', 'sip-printify-manager'); ?></button>
                    <button id="revert-changes" class="button"><?php esc_html_e('Revert Changes', 'sip-printify-manager'); ?></button>
                    <button id="save-template" class="button button-primary"><?php esc_html_e('Save Changes', 'sip-printify-manager'); ?></button>
                </div>
            </div>
        </div>
    </div>
</div>
