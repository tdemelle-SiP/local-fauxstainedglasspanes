var sip = sip || {};

sip.shopActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
    }

    function attachEventListeners() {
        $('#new-shop-form').on('submit', function(e) {
            e.preventDefault();
            handleNewShop(e);
        });

        $('#clear-shop-button').on('click', handleClearShop);
    }


    function handleNewShop(e) {
        e.preventDefault();
        console.log('handleNewShop Function Running');
        sip.utilities.showSpinner();  
        var token = $('#printify_bearer_token').val();
        console.log('Token to be sent:', token ? 'Not empty, length: ' + token.length : 'Empty');
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', 'new_shop');
        formData.append('printify_bearer_token', token);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('shop_action', formData);
    }

    function handleClearShop(e) {
        e.preventDefault();
        console.log("New Token Button Clicked");
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', 'clear_shop');
        formData.append('nonce', sipAjax.nonce);
    
        sip.ajax.handleAjaxAction('shop_action', formData);
    }    

    function handleShopActionFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation(); 
        var formData = new FormData(this);
        var action = $('#shop_action').val();

        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', action);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('shop_action', formData);
    }

    function handleSuccessResponse(response) {
        console.log('Handling success response for action type:', response.data.action);
        console.log('Registered handlers:', successHandlers);
        console.log('Response:', response);

        if (response.success) {
            if (response.data && response.data.reload) {
                // window.location.reload();  // Reload the page to show the new shop data
            } else {
                // Update the UI without reloading
                $('#auth-container').hide();
                $('#shop-container').show();
                sip.utilities.hideSpinner();
            }
        } else {
            console.error('Error loading shop:', response.data);
            sip.utilities.showToast(response.data, 5000, true);
            sip.utilities.hideSpinner();
        }
    }

    // Expose public methods
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('shop_action', sip.shopActions.handleSuccessResponse);