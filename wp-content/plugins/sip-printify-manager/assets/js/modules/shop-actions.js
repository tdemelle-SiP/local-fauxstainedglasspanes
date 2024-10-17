var sip = sip || {};

sip.shopActions = (function($, ajax, utilities) {
    function init() {
        console.log('Initializing shop actions module');
        console.log($('#clear-shop-button').length > 0 ? 'Button found' : 'Button not found');
        attachEventListeners();
    }

    function attachEventListeners() {
        console.log('Attaching event listeners for shop actions');

        // Event delegation for dynamically added elements
        $(document).on('click', '#clear-shop-button', function(e) {
            e.preventDefault();
            console.log('Clear shop button clicked'); // Debugging line

            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'shop_action');
            formData.append('shop_action', 'clear_shop');
            formData.append('nonce', sipAjax.nonce);

            sip.ajax.handleAjaxAction('clear_shop', formData, '#new-token-button', '#loading-spinner');
        });

        $('#new-shop-form').on('submit', function(e) {
            e.preventDefault();
            handleShopActionFormSubmit.call(this);
        });
    }

    function handleShopActionFormSubmit() {
        console.log('Handling shop action form submit');
        var formData = new FormData(this);
        var action = $('#shop_action').val();

        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', action);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('shop_action', formData);
    }

    // Define successHandlers
    var successHandlers = {
        new_shop: function(response) {
            console.log('Handling success for new_shop:', response);
            location.reload(); // Or handle response appropriately
        },
        clear_shop: function(response) {
            console.log('Handling success for clear_shop:', response);
            location.reload(); // Or handle response appropriately
        }
    };

    function handleSuccessResponse(actionType, response) {
        console.log('Handling success response for action type:', actionType);
    
        // Reload the page for 'clear_shop' and 'new_shop' actions
        if (actionType === 'clear_shop' || actionType === 'new_shop') {
            location.reload();  // Just reload the page for these actions
            return;  // Exit the function after reloading
        }
    
        // Handle other actions using successHandlers
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
    }

    // Expose public methods
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('shop_action', sip.shopActions.handleSuccessResponse);
