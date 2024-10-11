var sip = sip || {};

sip.productActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
    }

    function attachEventListeners() {
        $(document).on('click', '#reload-products-button', reloadShopProducts);
        $(document).off('submit', '.product-action-form').on('submit', '.product-action-form', handleProductActionFormSubmit);
    }

    function reloadShopProducts(e) {
        e.preventDefault();
        var formData = utilities.createFormData('product_action', 'reload');
        sip.ajax.handleAjaxAction('product_action', formData);
    }

    function handleProductActionFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation(); 
        var formData = new FormData(this);
        var action = $('#product_action').val();

        $('input[name="selected_products[]"]:checked').each(function() {
            formData.append('selected_products[]', $(this).val());
        });
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'product_action');
        formData.append('product_action', action);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('product_action', formData);
    }

    function handleSuccessResponse(response) {
        if (response.success && response.data.product_list_html) {
            if (response.data.product_list_html) {
                $('#product-table-list').html(response.data.product_list_html).show();
            }
            if (response.data.template_list_html) {
                $('#template-table-list').html(response.data.template_list_html).show();
            }
            if (response.data.message) {

            }
            $('input[name="selected_products[]"], #select-all-products').prop('checked', false);
        } else {
            console.error('Unexpected response format:', response);
        }
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('product_action', sip.productActions.handleSuccessResponse);