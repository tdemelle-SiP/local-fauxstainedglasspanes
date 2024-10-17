// jsTemplate.js

var sip = sip || {};

sip.jsUtilities = (function($, ajax, utilities) {

    function init() {
        attachEventListeners();
    }

    function attachEventListeners() {
        // Image action form submit event
        $('#stuff-action-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleStuffActionFormSubmit(e);
        });
    }

    function somethingToUseInAnotherModule() {
        // Do something
    }

    function handleStuffActionFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        var formData = new FormData(e.target);
        var action = $('#stuff_action').val();

        $('input[name="selected_stuff[]"]:checked').each(function() {
            formData.append('selected_stuff[]', $(this).val());
        });
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'stuff_action');
        formData.append('stuff_action', action);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('stuff_action', formData);
    }

    function handleSuccessResponse(response) {
        console.log('AJAX response received:', actionType);
    
        if (response.success) {
            switch(response.data.action) {   
                case 'get_stuff':
                    handleGetStuff(response.data);
                    break;
            }
        } else {            
            console.error('Error in AJAX response:', response.data);
            utilities.showToast('Error: ' + response.data, 5000);
        }    
    }

    function handleGetStuff(data) {
        console.log('Handling get stuff success:', data);
        $('#stuff-table-list').html(data.stuff_list_html).show();
        console.log('Stuff list HTML updated');
    }

    // Expose public methods
    return {
        init: init, //so main.js can initialize this module
        handleSuccessResponse: handleSuccessResponse, //so main.js can handle success responses
        somethingToUseInAnotherModule: somethingToUseInAnotherModule //so other modules can use this method
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('stuff_action', sip.stuffActions.handleSuccessResponse);