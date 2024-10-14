// core/ajax.js

var sip = sip || {};

sip.ajax = (function($) {
    var successHandlers = {};

    /**
     * Initialize the AJAX module
     * Sets up event listeners for global AJAX-related actions
     */
    function init() {
        // Any initialization code can go here
        console.log('AJAX module initialized');
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
                // Re-enable button
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
            },
            complete: function() {
                sip.utilities.hideSpinner();
            }
        });
    }

    function handleSuccessResponse(actionType, response) {
        console.log('Handling success response for action type:', actionType);
        console.log('Response:', response);

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

    function registerSuccessHandler(actionType, handler) {
        console.log('Registering success handler for', actionType);
        successHandlers[actionType] = handler;
    }

    // Expose public methods
    return {
        init: init,
        handleAjaxAction: handleAjaxAction,
        registerSuccessHandler: registerSuccessHandler
    };
})(jQuery);