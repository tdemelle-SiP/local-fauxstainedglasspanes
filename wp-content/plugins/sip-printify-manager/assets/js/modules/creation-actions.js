// creation-actions.js

var sip = sip || {};

sip.creationActions = (function($, ajax, utilities) {
    let selectedTemplateId = null;
    let isDirty = false; // Flag to track unsaved changes

    function init(templateData) {
        if (templateData && templateData.id) {
            selectedTemplateId = templateData.id;
            // Initialize the creation table or perform other actions with the template data
            initializeCreationTable(templateData);
            initializeCreationContainer();
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
        $('#close-template').on('click', closeTemplate);
    
        $('#creation-table').on('input', 'input, textarea', function() {
            isDirty = true;
        });
    
        // Bind the toggle function to the variant header row toggle button
        $('#creation-table').on('click', '.toggle-variant-rows', toggleVariantRows);
    
        // Add other event listeners here as needed
    }

    function initializeCreationContainer() {
        $('#product-creation-container').show();
        $('#creation-table').html(sip.utilities.getInitialTableHtml());
    }

    function checkForLoadedTemplate() {
        console.log('creation-action called; Checking for loaded template');
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'get_loaded_template');
        formData.append('nonce', sipAjax.nonce);
        sip.ajax.handleAjaxAction('creation_action', formData);
    }

    function handleSuccessResponse(response) {
        console.log('AJAX response received:', response);

        if (response.success) {
            switch(response.data.action) {
                // case 'get_initial_table_html':
                //     handleGetInitialTableHtml(response);
                //     break;
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
                case 'close_template':
                    handleCloseTemplateResponse(response.data);
                    console.log('***hidespinner called. Template closed successfully');
                    sip.utilities.hideSpinner();
                    break;

                default:
                    console.warn('Unhandled creation action type:', response.data.action);
            }
        } else {
            console.error('Error in AJAX response:', response.data);
            utilities.showToast('Error: ' + response.data, 5000);
        }
    }

    function handleGetLoadedTemplateSuccess(data) {
        if (data.template_data) {
            console.log('Loaded template data:', data.template_data);
            sip.templateActions.populateCreationTable(data.template_data);
            console.log('***hidespinner called. Template loaded successfully');
            sip.utilities.hideSpinner();
        } else {
            console.log('***hidespinner called.No template loaded, using initial HTML');
            $('#creation-table-container').html(sip.utilities.getInitialTableHtml());
            sip.utilities.hideSpinner();
        }
    }

    function handleUpdateNewProductSuccess(data) {
        console.log('Product data updated successfully');
        isDirty = false;
    }

    function handleCreateProductSuccess(data) {
        console.log('Product created successfully');
        isDirty = false;
        // You might want to reset the form or redirect the user
    }

    function handleSetLoadedTemplateSuccess(data) {
        console.log('Template data saved successfully');
    }

    function handleSaveTemplateSuccess(data) {
        console.log('Template saved successfully');
        isDirty = false;
    }

    function handleCloseTemplateResponse(data) {
        $('#creation-table-container').html(sip.utilities.getInitialTableHtml());
        // Unset the template name
        $('#selected-template-subtitle').text('');
        $('#product-creation-container').show();
        $('#creation-table').hide();
        $('#no-template-message').show();
    }
    
    function closeTemplate() {
        console.log('Closing template');
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'close_template');
        formData.append('nonce', sipAjax.nonce);
        sip.ajax.handleAjaxAction('creation_action', formData);
    }
    

    function saveTemplate() {
        return new Promise((resolve, reject) => {
            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'creation_action');
            formData.append('creation_action', 'save_template');
            formData.append('template_name', selectedTemplateId);
            formData.append('template_content', JSON.stringify(templateData));
            formData.append('nonce', sipAjax.nonce);
            sip.ajax.handleAjaxAction('creation_action', formData, resolve, reject);
            isDirty = false;
        });
    }

    function getDirtyState() {
        return isDirty;
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

    function toggleVariantRows() {
        const toggleButton = $(this); // Get the clicked button
        const isCollapsed = toggleButton.text() === '+'; // Check if currently collapsed
    
        // Toggle button text between "+" and "-"
        toggleButton.text(isCollapsed ? '-' : '+');
    
        // Show or hide variant rows based on the current state
        $('.variant-row').toggle(isCollapsed);
    }
    
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
        checkForLoadedTemplate: checkForLoadedTemplate,
        closeTemplate: closeTemplate,
        saveTemplate: saveTemplate,
        isDirty: getDirtyState
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('creation_action', sip.creationActions.handleSuccessResponse);