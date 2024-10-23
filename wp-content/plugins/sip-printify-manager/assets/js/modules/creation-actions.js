// creation-actions.js

var sip = sip || {};

sip.creationActions = (function($, ajax, utilities) {
    let selectedTemplateId = null;
    let isDirty = false; // Flag to track unsaved changes
    let hasUnsavedChanges = false;
    let currentTemplateId = null;


    function init(templateData) {
        if (templateData && templateData.id) {
            selectedTemplateId = templateData.id;
            currentTemplateId = templateData.id;
            // Don't check for loaded template since we already have one
            attachEventListeners();
        } else {
            // Check if there's a template in the URL or localStorage before checking server
            const savedTemplate = localStorage.getItem('lastSelectedTemplate');
            if (savedTemplate) {
                // Template exists in localStorage, load it properly through template actions
                // instead of making a separate check
                const formData = new FormData();
                formData.append('action', 'sip_handle_ajax_request');
                formData.append('action_type', 'template_action');
                formData.append('template_action', 'create_new_products');
                formData.append('selected_templates[]', savedTemplate);
                formData.append('nonce', sipAjax.nonce);
                sip.ajax.handleAjaxAction('template_action', formData);
            }
            attachEventListeners();
        }
    }

    function handleClose() {
        if (hasUnsavedChanges) {
            const shouldSave = confirm('You have unsaved changes. Would you like to save before closing?');
            closeCreationEditor(shouldSave);
        } else {
            closeCreationEditor(false);
        }
    }

    function attachEventListeners() {
        $('#creation-action-form').on('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    
        $('#creation-table').on('click', '.editable', handleCellEdit);
        $('#creation-table').on('click', '.edit-button', handleDescriptionEdit);
        $('#close-template').on('click', handleClose);
        $('#save-template').on('click', handleCreationEditorSave); 
    
        // Bind the toggle function to the variant header row toggle button
        $('#creation-table').on('click', '.toggle-variant-rows', function() {
            console.log('Toggling variant rows');
            toggleVariantRows.call(this);
        });

        $('#edit-json').on('click', function() {
            console.log('Edit JSON clicked');
            const overlay = $('#template-editor-overlay');
            overlay.show().addClass('active');
        
            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'creation_action');
            formData.append('creation_action', 'edit_json');
            formData.append('nonce', sipAjax.nonce);
        
            sip.ajax.handleAjaxAction('creation_action', formData);
        });

    }

    function handleSuccessResponse(response) {
        console.log('AJAX response received:', response);
    
        if (response.success) {
            switch(response.data.action) {
                case 'get_current_template':
                    handleGetLoadedTemplateSuccess(response.data);
                    break;
                case 'create_product':
                    handleCreateProductSuccess(response.data);
                    break;
                case 'update_wip':
                    handleUpdateWipSuccess(response.data);
                    break;

                case 'edit_json':
                    handleEditJsonSuccess(response.data);
                    break
                case 'save_creation_editor_template':
                    hasUnsavedChanges = false;
                    updateSaveButtonState();
                    break;
                case 'close_creation_editor':
                    handleCloseTemplateResponse();
                    break;

                default:
                    console.warn('Unhandled creation action type:', response.data.action);
            }
        } else {
            console.error('Error in AJAX response:', response.data);
            utilities.showToast('Error: ' + response.data, 5000);
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////PRODUCT CREATION TABLE FUNCTIONS////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function handleGetLoadedTemplateSuccess(data) {
        if (data.template_data) {
            console.log('creation-action.js getloadedtemplate success - Loaded template data:', data.template_data);
            sip.templateActions.populateCreationTable(data.template_data);
            console.log('***hidespinner called. Template loaded successfully');
            sip.utilities.hideSpinner();
        } else {
            console.log('***hidespinner called.No template loaded, using initial HTML');
            $('#creation-table-container').html(sip.utilities.getInitialTableHtml());
            sip.utilities.hideSpinner();
        }
    }

    // Creation Editor handlers
    function handleCreationEditorSave() {
        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'save_creation_editor_template');
        formData.append('template_name', currentTemplateId);
        formData.append('template_data', JSON.stringify(getCurrentTemplateData()));
        formData.append('nonce', sipAjax.nonce);
        
        sip.ajax.handleAjaxAction('creation_action', formData);
    }

    function closeCreationEditor(saveChanges) {
        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'close_creation_editor');
        formData.append('template_name', currentTemplateId);
        formData.append('save_changes', saveChanges);
        formData.append('nonce', sipAjax.nonce);
        
        sip.ajax.handleAjaxAction('creation_action', formData);
    }

    function handleUpdateWipSuccess(data) {
        console.log('Product data updated successfully');
        isDirty = false;
    }

    function handleCreateProductSuccess(data) {
        console.log('Product created successfully');
        isDirty = false;
        // You might want to reset the form or redirect the user
    }

    function handleCloseTemplateResponse(data) {
        // Clear interface state
        $('#image-table-content tr').removeClass('created wip archived');
        $('#template-table-content tr').removeClass('wip');
        
        // Clear stored states
        window.lastSelectedTemplate = null;
        localStorage.removeItem('lastSelectedTemplate');
        localStorage.removeItem('sip_image_highlights');
        
        // Reset view
        $('#creation-table-container').html(sip.utilities.getInitialTableHtml());
        $('#selected-template-subtitle').text('');
        $('#product-creation-container').show();
        $('#creation-table').hide();
        $('#no-template-message').show();
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
        formData.append('creation_action', 'update_wip');
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

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////TEMPLATE EDITOR FUNCTIONS///////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function handleEditJsonSuccess(data) {
        console.log('Initializing editors with template data:', data.template_data);
        sip.templateEditor.initializeEditors(data.template_data);
        utilities.hideSpinner();
    }

    //////////////////////////////UTILITY FUNCTIONS//////////////////////////////////////
    function escapeHtml(string) {
        const entityMap = {
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;', '/': '&#x2F;'
        };
        return String(string).replace(/[&<>"'\/]/g, s => entityMap[s]);
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
        handleCloseTemplateResponse: handleCloseTemplateResponse,
        saveTemplate: saveTemplate,
        isDirty: getDirtyState
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('creation_action', sip.creationActions.handleSuccessResponse);