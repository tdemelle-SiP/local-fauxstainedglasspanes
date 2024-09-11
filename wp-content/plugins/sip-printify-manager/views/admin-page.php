<?php
<div class="wrap">
    <h1>SIP Printify Manager</h1>

    <?php if (empty($token)) : ?>
        <h2>API Token</h2>
        <form id="save-token-form">
            <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
            <label for="printify_bearer_token">Printify Bearer Token:</label>
            <input type="text" name="printify_bearer_token" value="" class="regular-text" required/>
            <input type="submit" name="save_token" value="Save Token" class="button button-primary"/>
        </form>
    <?php else : ?>
        <h2>Authorized</h2>
        <form id="authorization-form">
            <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
            <input type="submit" name="reauthorize" value="Re-authorize" class="button button-secondary"/>
            <input type="submit" name="new_token" value="New Token" class="button button-primary"/>
        </form>

        <?php if (!empty($shop_name)) : ?>
            <h2>Shop: <?php echo esc_html($shop_name); ?></h2>
            <h2>Products</h2>
            <form id="product-action-form" style="display: flex; align-items: center;">
                <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
                <label for="product_action">Product Actions: </label>
                <select name="product_action" id="product_action">
                    <option value="reload">Reload</option>
                    <option value="create_template">Create Template</option>
                    <option value="remove_from_manager">Remove from Manager</option>
                </select>
                <input type="submit" name="execute_action" value="Execute" class="button button-secondary" style="margin-left: 10px;" />
                
                <!-- Spinner -->
                <div id="loading-spinner" style="display: none; margin-left: 10px;">
                    <img src="<?php echo plugin_dir_url(dirname(__FILE__)); ?>assets/images/spinner.webp" alt="Loading..." width="24" height="24"/>
                </div>
            </form>
            <div id="product-list">
                <?php 
                if (!empty($products)) {
                    sip_display_product_list($products);
                } else {
                    echo '<p>No products found.</p>';
                }
                ?>
            </div>
                
        <?php else : ?>
            <h2>Shop could not be loaded. Please try re-authorizing.</h2>
        <?php endif; ?>
    <?php endif; ?>

    <?php if (!empty($templates)) : ?>
        <h2>Templates</h2>
        <form id="template-action-form">
            <?php wp_nonce_field('sip_printify_manager_nonce_action', 'sip_printify_manager_nonce_name'); ?>
            <label for="template_action">Template Actions: </label>
            <select name="template_action" id="template_action">
                <option value="delete_template">Delete Template</option>
                <option value="rename_template">Rename Template</option>
                <option value="edit_template">Edit Template</option>
            </select>
            <input type="submit" name="execute_template_action" value="Execute" class="button button-secondary"/>
            <div id="rename-template-input" style="display: none; margin-top: 10px;">
                <input type="text" name="new_template_name" placeholder="New template name">
            </div>
        </form>
        <div id="template-list">
            <?php sip_display_template_list($templates); ?>
        </div>
        <div id="template-editor" style="display: none; margin-top: 20px;">
            <h3>Edit Template: <span id="editing-template-name"></span></h3>
            <textarea id="template-content" rows="20" style="width: 100%;"></textarea>
            <div style="margin-top: 10px;">
                <button id="close-editor" class="button">Close</button>
                <button id="revert-changes" class="button">Revert Changes</button>
                <button id="save-template" class="button button-primary">Save Changes</button>
            </div>
        </div>
    <?php else : ?>
        <h2>No templates found.</h2>
    <?php endif; ?>
</div>