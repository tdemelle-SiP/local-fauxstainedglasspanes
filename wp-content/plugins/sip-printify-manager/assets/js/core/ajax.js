// core/ajax.js

var sip = sip || {};

sip.ajax = (function($) {
    var successHandlers = {};
    /**
     * Initialize the AJAX module
     * Sets up event listeners for global AJAX-related actions
     */
    function init() {
        // Handle New Store Token button click
        $('#new-token-button').on('click', function (e) {
            e.preventDefault();
            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'new_token');
            formData.append('nonce', sipAjax.nonce);
            handleAjaxAction('new_token', formData, '#new-token-button', '#loading-spinner');
        });

        // Handle Save Token form submission
        $('#save-token-form').on('submit', function (e) {
            e.preventDefault();
            var formData = new FormData(this);
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'save_token');
            formData.append('nonce', sipAjax.nonce);
            handleAjaxAction('save_token', formData, null, '#loading-spinner');
        });
    }

    /**
     * Handle all AJAX actions
     * @param {string} actionType - Type of action being performed
     * @param {FormData} formData - Form data to be sent with the request
     * @param {string|null} buttonSelector - Selector for the button to disable during request
     * @param {string|null} spinnerSelector - Selector for the spinner to show during request
     */
    function handleAjaxAction(actionType, formData, buttonSelector = null, spinnerSelector = null) {
        // Disable button and show spinner
        if (buttonSelector) {
            $(buttonSelector).attr('disabled', true);
        }

        sip.utilities.showSpinner();

        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                // Re-enable button and hide spinner
                if (buttonSelector) {
                    $(buttonSelector).attr('disabled', false);
                }

                if (response.success) {
                    handleSuccessResponse(actionType, response);
                } else {
                    handleErrorResponse(response.data);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                handleAjaxError(jqXHR, textStatus, errorThrown, buttonSelector, spinnerSelector);
            }
        });
    }

    function registerSuccessHandler(actionType, handler) {
        successHandlers[actionType] = handler;
    }

    /**
     * Handle successful AJAX responses
     * @param {string} actionType - Type of action that was performed
     * @param {Object} response - Response data from the server
     */
    function handleSuccessResponse(actionType, response) {
        console.log('Handling success response for action type:', actionType);
        console.log('Registered handlers:', successHandlers);
        
        switch (actionType) {
            case 'save_token':
            case 'new_token':
                location.reload();
                break;
            default:
                if (successHandlers[actionType]) {
                    successHandlers[actionType](response);
                } else {
                    console.warn('No success handler found for action type:', actionType);
                }
            sip.utilities.hideSpinner();
        }
    }

    /**
     * Handle error responses from AJAX requests
     * @param {string} errorMessage - Error message received from the server
     */
    function handleErrorResponse(errorMessage) {
        sip.utilities.showToast('Error: ' + errorMessage, 5000);
    }

    /**
     * Handle AJAX errors
     * @param {Object} jqXHR - jQuery XHR object
     * @param {string} textStatus - Status of the error
     * @param {string} errorThrown - Error message thrown
     * @param {string|null} buttonSelector - Selector for the button to re-enable
     * @param {string|null} spinnerSelector - Selector for the spinner to hide
     */
    function handleAjaxError(jqXHR, textStatus, errorThrown, buttonSelector, spinnerSelector) {
        if (buttonSelector) {
            $(buttonSelector).attr('disabled', false);
        }

        console.error('AJAX Error:', textStatus, errorThrown, jqXHR.responseText);
        sip.utilities.showToast('AJAX Error occurred: ' + textStatus + ' - ' + errorThrown, 5000);
    }

    // Expose public methods
    return {
        init: init,
        handleAjaxAction: handleAjaxAction,
        registerSuccessHandler: registerSuccessHandler
    };
})(jQuery);