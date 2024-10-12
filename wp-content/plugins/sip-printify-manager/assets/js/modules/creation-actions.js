// creation-actions.js

var sip = sip || {};

sip.creationActions = (function($, ajax, utilities) {
    let selectedTemplateId = null;
    let isDirty = false; // Flag to track unsaved changes

    function init(templateData) {
        console.log('Initializing product creation...');
        if (templateData && templateData.id) {
            selectedTemplateId = templateData.id;
            // Initialize the creation table or perform other actions with the template data
        }
        attachEventListeners();
    }

    function attachEventListeners() {
        $('#creation-action-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        $('#creation-table').on('click', '.editable', handleCellEdit);
        $('#creation-table').on('click', '.edit-button', handleDescriptionEdit);


        // Add other event listeners here as needed
    }

       
    function handleCellEdit() {
        const $cell = $(this);
        const currentText = $cell.text().trim();
        const input = $('<input type="text" class="editable-input" value="' + escapeHtml(currentText) + '">');
        
        $cell.html(input);
        input.focus();

        input.on('blur', function() {
            const newValue = $(this).val();
            updateCellValue($cell, newValue);
        });
    }

    function handleDescriptionEdit() {
        const $cell = $(this).closest('td');
        const currentText = $cell.find('span').text().trim();
        
        // Implement a modal or more sophisticated editor for description
        const newText = prompt('Edit Description:', currentText);
        
        if (newText !== null) {
            updateCellValue($cell, newText);
        }
    }

    function updateCellValue($cell, newValue) {
        const key = $cell.data('key');
        $cell.html(escapeHtml(newValue));
        
        if (key === 'description') {
            $cell.append('<button class="edit-button" title="Edit">&#9998;</button>');
        }

        isDirty = true;

        // Here you might want to send an AJAX request to update the server
        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'update_new_product');
        formData.append('key', key);
        formData.append('value', newValue);
        formData.append('template_name', selectedTemplateId);
        formData.append('nonce', sipAjax.nonce);

        ajax.handleAjaxAction('creation_action', formData);
    }



    function handleSuccessResponse(response) {
        console.log('AJAX response received:', response);
        utilities.hideSpinner();
    
        if (response.success) {
            console.log('Product data updated successfully');
            isDirty = false;
        } else {
            console.error('Error in AJAX response:', response.data);
        }
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };

})(jQuery, sip.ajax, sip.utilities);

// Register the success handler
sip.ajax.registerSuccessHandler('creation_action', sip.creationActions.handleSuccessResponse);