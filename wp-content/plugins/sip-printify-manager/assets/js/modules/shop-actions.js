var sip = sip || {};

sip.shopActions = (function($) {
    var successHandlers = {};

    // Document Ready - Ensure jQuery is ready and listeners are attached
    $(document).ready(function() {
        init();  // Call init to attach event listeners when the DOM is ready
    });

    function init() {
        attachEventListeners();  // Attach all event listeners
    }

    function attachEventListeners() {
        $(document).on('click', '#reload-products-button', reloadShopProducts);
        $(document).off('submit', '.product-action-form').on('submit', '.product-action-form', handleProductActionFormSubmit);
        $('#save-token-button').on('click', handleSaveToken);
        $('#new-token-button').on('click', handleNewToken);
    }    

    function handleSaveToken() {
        var token = $('#printify_bearer_token').val();
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', 'save_token');
        formData.append('printify_bearer_token', token);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('shop_action', formData);
    }

    function handleNewToken() {
        console.log("New Token Button Clicked");
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', 'new_token');
        formData.append('nonce', sipAjax.nonce);
    
        sip.ajax.handleAjaxAction('shop_action', formData);
    }    

    function handleSuccessResponse(actionType, response) {
        console.log('Handling success response for action type:', actionType);
        console.log('Registered handlers:', successHandlers);
        console.log('Response:', response);

        switch (actionType) {
            case 'save_token':
            case 'new_token':
                location.reload();
                break;
            default:
                if (successHandlers[actionType]) {
                    console.log('Calling success handler for', actionType);
                    try {
                        successHandlers[actionType](response);
                    } catch (error) {
                        console.error('Error in success handler for', actionType, ':', error);
                    }
                } else {
                    console.warn('No success handler found for action type:', actionType);
                }
                console.log('Exiting handleSuccessResponse in ajax.js');
                sip.utilities.hideSpinner();
                break;
        }
    }

    function registerSuccessHandler(actionType, handler) {
        console.log('Registering success handler for', actionType);
        successHandlers[actionType] = handler;
    }

    // Expose public methods
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
        registerSuccessHandler: registerSuccessHandler
    };

})(jQuery);