// product-actions.js

var sip = sip || {};

sip.productActions = (function($, ajax, utilities) {
    /**
     * Initialize product actions
     */
    function init() {
        attachReloadProductsEvent();
        attachProductActionFormSubmit();
    }

    /**
     * Attach event listener for reloading products
     */
    function attachReloadProductsEvent() {
        $(document).on('click', '#reload-products-button', function(e) {
            e.preventDefault();
            reloadShopProducts();
        });
    }

    /**
     * Reload shop products via AJAX
     */
    function reloadShopProducts() {
        utilities.showSpinner();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'product_action');
        formData.append('product_action', 'reload');
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('product_action', formData);
    }

    /**
     * Attach event listener for product action form submission
     */
    function attachProductActionFormSubmit() {
        $('.product-action-form').on('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var action = $('#product_action').val();

            // Collect selected products from checkboxes
            var selectedProducts = [];
            $('input[name="selected_products[]"]:checked').each(function() {
                selectedProducts.push($(this).val());
            });
            // Remove any existing 'selected_products[]' entries to avoid duplicates
            formData.delete('selected_products[]');
            // Append each selected product to formData
            selectedProducts.forEach(function(productId) {
                formData.append('selected_products[]', productId);
            });

            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'product_action');
            formData.append('product_action', action);
            formData.append('nonce', sipAjax.nonce);

            utilities.showSpinner();

            sip.ajax.handleAjaxAction('product_action', formData);
        });
    }

    /**
     * Handle successful AJAX response for product actions
     * @param {Object} response - The AJAX response object
     */
    function handleSuccessResponse(response) {
        if (response.data.product_list_html) {
            $('#product-table-list').html(response.data.product_list_html).show();
        }
        if (response.data.template_list_html) {
            $('#template-table-list').html(response.data.template_list_html).show();
        }

        // Uncheck all selected products
        $('input[name="selected_products[]"]').prop('checked', false);
        // Uncheck the select all checkbox
        $('#select-all-products').prop('checked', false);

        attachReloadProductsEvent(); // Reattach event listener after refresh

        utilities.hideSpinner();
    }

    // Expose public methods
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('product_action', sip.productActions.handleSuccessResponse);

// Initialize product actions when the document is ready
jQuery(document).ready(function() {
    sip.productActions.init();
});