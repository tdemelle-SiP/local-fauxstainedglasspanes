// productHandlers.js

var sip = sip || {};

sip.productHandlers = (function($) {
    function init() {
        attachReloadProductsEvent();
        attachProductActionFormSubmit();
    }

    function attachReloadProductsEvent() {
        $(document).on('click', '#reload-products-button', function(e) {
            e.preventDefault();
            reloadShopProducts();
        });
    }

    function reloadShopProducts() {
        $('#spinner-overlay').show();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'product_action');
        formData.append('product_action', 'reload');
        formData.append('nonce', sipAjax.nonce);

        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    $('#product-table-list').html(response.data.product_list_html);
                    if (typeof sip.eventHandlers.initProductSorting === 'function') {
                        sip.eventHandlers.initProductSorting();
                    }
                    attachReloadProductsEvent();  // Reattach event listener after refresh
                } else {
                    console.error('Failed to reload products:', response.data.message);
                }
            },
            error: function() {
                console.error('An error occurred while reloading the products.');
            },
            complete: function() {
                $('#spinner-overlay').hide();
            }
        });
    }

    function attachProductActionFormSubmit() {
        $('.product-action-form').on('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var action = $('#product_action').val();

            $('input[name="selected_products[]"]:checked').each(function() {
                formData.append('selected_products[]', $(this).val());
            });
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'product_action');
            formData.append('product_action', action);
            formData.append('nonce', sipAjax.nonce);

            $('#spinner-overlay').show();

            $.ajax({
                url: sipAjax.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        $('#product-table-list').html(response.data.product_list_html);
                        if (typeof sip.eventHandlers.initProductSorting === 'function') {
                            sip.eventHandlers.initProductSorting();
                        }
                        attachReloadProductsEvent();
                    } else {
                        console.error('Action failed:', response.data.message);
                    }
                },
                error: function() {
                    console.error('An error occurred while processing the action.');
                },
                complete: function() {
                    $('#spinner-overlay').hide();
                }
            });
        });
    }

    return {
        init: init
    };
})(jQuery);