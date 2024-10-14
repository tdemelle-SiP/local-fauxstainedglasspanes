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
        } else {
            // If no template data is provided, check for a loaded template
            checkForLoadedTemplate();
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
        $('#close-template').on('click', handleCloseTemplate);
        $('#creation-table').on('input', 'input, textarea', function() {
            isDirty = true;
        });

        // Add other event listeners here as needed
    }

    function checkForLoadedTemplate() {
        console.log('Checking for loaded template');
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'get_loaded_template');
        formData.append('nonce', sipAjax.nonce);
        sip.ajax.handleAjaxAction('creation_action', formData);
    }

    function handleSuccessResponse(response) {
        console.log('AJAX response received:', response);
        utilities.hideSpinner();

        if (response.success) {
            switch(response.data.action) {
                case 'get_loaded_template':
                    handleGetLoadedTemplateSuccess(response.data);
                    break;
                case 'update_new_product':
                    handleUpdateNewProductSuccess(response.data);
                    break;
                case 'create_product':
                    handleCreateProductSuccess(response.data);
                    break;
                case 'set_loaded_template':
                    handleSetLoadedTemplateSuccess(response.data);
                    break;
                case 'save_template':
                    handleSaveTemplateSuccess(response.data);
                    break;
                case 'clear_loaded_template':
                    console.log('Template cleared successfully');
                    if (response.data.initial_html) {
                        $('#creation-table').html(response.data.initial_html);
                    }
                    utilities.showToast('Template cleared successfully', 3000);
                    break;

                default:
                    console.warn('Unhandled creation action type:', response.data.action);
            }
        } else {
            console.error('Error in AJAX response:', response.data);
            utilities.showToast('Error: ' + response.data, 5000);
        }
    }

    function waitForTableToPopulate(table) {
        return new Promise((resolve) => {
            console.log('Starting to observe table population');
            const observer = new MutationObserver((mutations) => {
                if (table.find('tbody tr').length > 0) {
                    console.log('Table population observed');
                    observer.disconnect();
                    resolve();
                }
            });
    
            observer.observe(table[0], {
                childList: true,
                subtree: true
            });
    
            // Failsafe: resolve after 5 seconds if table doesn't populate
            setTimeout(() => {
                console.log('Failsafe timeout reached for table population');
                observer.disconnect();
                resolve();
            }, 5000);
        });
    }

    function handleGetLoadedTemplateSuccess(data) {
        if (data.template_data) {
            console.log('Loaded template data:', data.template_data);
            sip.templateActions.populateCreationTable(data.template_data);
        } else if (data.initial_html) {
            console.log('No template loaded, using initial HTML');
            $('#creation-table').html(data.initial_html);
        } else {
            console.error('Invalid response for get_loaded_template');
        }
    }

    function handleUpdateNewProductSuccess(data) {
        console.log('Product data updated successfully');
        isDirty = false;
        utilities.showToast('Product data updated successfully', 3000);
    }

    function handleCreateProductSuccess(data) {
        console.log('Product created successfully');
        isDirty = false;
        utilities.showToast('Product created successfully', 3000);
        // You might want to reset the form or redirect the user
    }

    function handleSetLoadedTemplateSuccess(data) {
        console.log('Template data saved successfully');
        utilities.showToast('Template data saved successfully', 3000);
    }

    function handleSaveTemplateSuccess(data) {
        console.log('Template saved successfully');
        isDirty = false;
        utilities.showToast('Template saved successfully', 3000);
    }

    function handleCloseTemplate() {
        if (isDirty) {
            if (confirm('You have unsaved changes. Do you want to save before closing?')) {
                saveTemplate();
            }
        }
        closeTemplate();
    }

    function closeTemplate() {
        $('#product-creation-container').hide();
        $('#selected-template-name').text('');
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'clear_loaded_template');
        formData.append('nonce', sipAjax.nonce);
        sip.ajax.handleAjaxAction('creation_action', formData);
        isDirty = false;
    }

    function saveTemplate() {
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'save_template');
        formData.append('template_name', selectedTemplateId);
        formData.append('template_content', JSON.stringify(templateData));
        formData.append('nonce', sipAjax.nonce);
        sip.ajax.handleAjaxAction('creation_action', formData);
        isDirty = false;
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

        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'update_new_product');
        formData.append('key', key);
        formData.append('value', newValue);
        formData.append('template_name', selectedTemplateId);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('creation_action', formData);
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
        checkForLoadedTemplate: checkForLoadedTemplate,
        closeTemplate: closeTemplate
    };

})(jQuery, sip.ajax, sip.utilities);

// Register the success handler
sip.ajax.registerSuccessHandler('creation_action', sip.creationActions.handleSuccessResponse);