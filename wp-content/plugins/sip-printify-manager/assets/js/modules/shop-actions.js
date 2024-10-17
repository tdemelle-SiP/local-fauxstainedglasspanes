var sip = sip || {};

sip.shopActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
    }

    function attachEventListeners() {

        // Event delegation for dynamically added elements
        $(document).on('click', '#clear-shop-button', function(e) {
            e.preventDefault();
            console.log('Clear shop button clicked'); // Debugging line

            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'shop_action');
            formData.append('shop_action', 'clear_shop');
            formData.append('nonce', sipAjax.nonce);
            //since formData is added above, don't need to go through a handler, can just send to ajax.js
            sip.ajax.handleAjaxAction('shop_action', formData, '#clear-shop-button', '#loading-spinner');
        });

        $('#new-shop-form').on('submit', function(e) {
            e.preventDefault();
            console.log('Load New Shop Clicked'); // Debugging line
            // Set the actionType
            var shop_action = 'new_shop';

            //formData needs to be added so it needs to go to handleShopActionForSubmit before sending to ajax.js
            handleShopActionFormSubmit.call(this, shop_action);
        });
    }

    function handleShopActionFormSubmit(shop_action) {
        console.log('Handling shop action form submit');

        var formData = new FormData(this);
        // action: 'sip_handle_ajax_request' is set below
        // actionType: 'shop_action' is set below
        // shop_action: 'set by data attribute on the html element and passed here as a parameter'

        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', shop_action);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('shop_action', formData);
    }

    function handleSuccessResponse(response) {
        console.log('Success Response received by frontend:', response);
    
        // Ensure response is properly structured
        if (typeof response === 'object' && response.success && response.data) {
            // Log the standardized success message
            console.log(response.data.message);
    
            // Handle specific shop actions with different responses
            switch (response.data.shop_action) {
                case 'new_shop':
                    console.log('New shop loaded successfully');
                    location.reload();  // Reload for new_shop
                    break;
    
                case 'clear_shop':
                    console.log('Shop has been cleared successfully');
                    location.reload();  // Reload for clear_shop
                    break;

                default:
                    console.log('***hidespinner called; Action performed:', response.data.shop_action);
                    sip.utilities.hideSpinner(); // H
                    break;
            }
        } else {
            console.error('***hidespinner called; Error processing action:', response.data ? response.data.message : 'Unknown error');
            sip.utilities.hideSpinner(); // H
        }
    }

    // Expose public methods
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('shop_action', sip.shopActions.handleSuccessResponse);
