var sip = sip || {};

sip.shopActions = (function($, ajax, utilities) {
    var successHandlers = {};

    $(document).ready(function() {
        init();
    });

    function init() {
        console.log('Initializing shop actions');
        console.log('attaching event listeners for shop actions');
        attachEventListeners();
    }

    function attachEventListeners() {
        console.log('Attaching event listeners for shop actions');
        
        var $saveButton = $('#save-token-button');
        console.log('Save button exists:', $saveButton.length > 0);
        
        $saveButton.on('click', function(e) {
            console.log('Save token button clicked');
            handleSaveToken(e);
        });
    
        $('#new-token-button').on('click', handleNewToken);
        $(document).off('submit', '.product-action-form').on('submit', '.product-action-form', handleShopActionFormSubmit);
    }  

    function handleSaveToken(e) {
        console.log('###########################handleSaveToken Function Running#################################');

        e.preventDefault();
        var token = $('#printify_bearer_token').val();
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', 'save_token');
        formData.append('printify_bearer_token', token);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('shop_action', formData);
    }

    function handleNewToken(e) {
        e.preventDefault();
        console.log("New Token Button Clicked");
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'shop_action');
        formData.append('shop_action', 'new_token');
        formData.append('nonce', sipAjax.nonce);
    
        sip.ajax.handleAjaxAction('shop_action', formData);
    }    

    function handleShopActionFormSubmit(e) {
        console.log('#######################################handleShopActionForm Submit Function Started#########################################');
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
            switch(response.data.action) {
                case 'save_token':
                case 'new_token':
                    location.reload();
                    break;
                default:
                    if (successHandlers[response.data.action]) {
                        console.log('Calling success handler for', response.data.action);
                        try {
                            successHandlers[response.data.action](response);
                        } catch (error) {
                            console.error('Error in success handler for', response.data.action, ':', error);
                        }
                    } else {
                        console.warn('No success handler found for action type:', response.data.action);
                    }
                    console.log('Exiting handleSuccessResponse in ajax.js');
                    sip.utilities.hideSpinner();
                    break;
            }
        }
    }

    // Expose public methods
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('shop_action', sip.shopActions.handleSuccessResponse);