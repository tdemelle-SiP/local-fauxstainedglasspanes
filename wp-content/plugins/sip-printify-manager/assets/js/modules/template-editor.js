// template-editor.js

var sip = sip || {};

sip.templateEditor = (function($, ajax, utilities) {
    // Module-level variables for editor instances and state
    let descriptionEditor = null;
    let jsonEditor = null;
    let jsonEditorHasChanges = false;
    let currentTemplateId = null;
    let saveButton = null;

    // Initialize module
    function init() {
        // Only set up events that don't require editor instances
        $(document).on('click', '.edit-template-content', handleTemplateEdit);
    }

    // Handle template edit button click
    function handleTemplateEdit() {
        const templateName = $(this).closest('tr').find('.template-name-cell').data('template-name');
        currentTemplateId = templateName;  // Set currentTemplateId when editing starts
        console.log('Setting currentTemplateId:', currentTemplateId); // Debug log
        
        $('#template-editor-overlay').show().addClass('active');
        $('#template-editor-header span').text('Edit Template: ' + templateName);
        
        loadTemplateContent(templateName);
    }

    function loadTemplateContent(templateName) {
        const wip_exists = false;  // Need to add check for WIP file first
        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'template_editor');
        formData.append('template_editor', 'json_editor_edit_template');
        formData.append('template_name', templateName);
        formData.append('check_wip', true);  // Add flag to check WIP first
        formData.append('nonce', sipAjax.nonce);
    
        sip.ajax.handleAjaxAction('template_editor', formData);
    }

    // Initialize editors and set up editor-specific events
    function initializeEditors(content, templateId) {
        // Set template ID first
        currentTemplateId = templateId;
        console.log('Template editor initialized with template:', currentTemplateId);
        const outerWindow = document.getElementById('template-editor-outer-window');
        const header = document.getElementById('template-editor-header');
        const resizer = document.getElementById('template-editor-resizer');
        const toggleButton = document.getElementById('template-editor-toggle-view');
        const topEditorContainer = document.getElementById('template-editor-top-editor');
        const bottomEditorContainer = document.getElementById('template-editor-bottom-editor');
        const renderedHtml = document.getElementById('template-editor-rendered-html');

        const separatedContent = utilities.separateTemplateContent(content);
        
        // Initialize CodeMirror editors
        descriptionEditor = wp.CodeMirror(topEditorContainer, {
            mode: 'htmlmixed',
            lineNumbers: true,
            lineWrapping: true,
            dragDrop: false,
            viewportMargin: Infinity,
            value: separatedContent.html,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });

        jsonEditor = wp.CodeMirror(bottomEditorContainer, {
            mode: 'application/json',
            lineNumbers: true,
            lineWrapping: true,
            dragDrop: false,
            viewportMargin: Infinity,
            value: separatedContent.json,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Ctrl-Q": function(cm) {
                    cm.foldCode(cm.getCursor());
                }
            }
        });

        // Set up editor UI
        const totalHeight = outerWindow.clientHeight - header.clientHeight - resizer.clientHeight;
        const halfHeight = totalHeight / 2;

        resizer.previousElementSibling.style.height = `${halfHeight}px`;
        resizer.nextElementSibling.style.height = `${halfHeight}px`;
        
        descriptionEditor.setSize(null, halfHeight - 30);
        jsonEditor.setSize(null, halfHeight - 30);
        
        // Initialize UI components
        setupResizeFunctionality(outerWindow, header, resizer);
        setupToggleView(toggleButton, renderedHtml, topEditorContainer);
        setupDragging(header, outerWindow);
        
        // Set up editor event handlers
        setupEditorEvents();

        // Refresh editors
        descriptionEditor.refresh();
        jsonEditor.refresh();
    }

    // Set up events specific to editor functionality
    function setupEditorEvents() {
        saveButton = $('#template-editor-save');

        // Remove any existing event listeners before adding new ones
        saveButton.off('click').on('click', handleJsonEditorSave);
        $('#template-editor-close').off('click').on('click', handleJsonEditorClose);
        
        // Editor change tracking
        jsonEditor.on('change', function() {
            jsonEditorHasChanges = true;
            saveButton.addClass('has-changes');
        });

        descriptionEditor.on('change', function() {
            jsonEditorHasChanges = true;
            saveButton.addClass('has-changes');
        });
    }

    // Get combined content from both editors
    function getEditorContent() {
        try {
            const description = descriptionEditor.getValue();
            const jsonContent = JSON.parse(jsonEditor.getValue());
            console.log('Parsed JSON content:', jsonContent);
            jsonContent.description = description;
            const finalContent = JSON.stringify(jsonContent);
            console.log('Final content to save:', finalContent);
            return finalContent;
        } catch (e) {
            console.error('Error getting editor content:', e);
            utilities.showToast('Invalid JSON format', 5000);
            return null;
        }
    }

    function handleSuccessResponse(response) {
        if (response.success) {
            switch(response.data.action) {
                case 'json_editor_save':
                case 'json_editor_save_template':
                    jsonEditorHasChanges = false;
                    saveButton.removeClass('has-changes');
                    sip.utilities.hideSpinner();
                    sip.utilities.showToast('Changes saved successfully', 3000);
                    sip.creationActions.reloadCreationTable(); 
                    break;
                case 'json_editor_close':
                    $('#template-editor-overlay').removeClass('active').hide();
                    sip.utilities.hideSpinner();
                    break;
                default:
                    console.warn('Unhandled template editor action:', response.data.action);
                    sip.utilities.hideSpinner();
            }
        } else {
            sip.utilities.hideSpinner();
            sip.utilities.showToast('Error: ' + response.data, 5000);
        }
    }

    function handleJsonEditorSave(callback) {
        const content = getEditorContent();
        if (!content) {
            sip.utilities.hideSpinner();
            return;
        }
    
        console.log('Saving template:', currentTemplateId);
        sip.utilities.showSpinner('#template-editor-overlay');
        
        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'template_editor');
        formData.append('template_editor', 'json_editor_save_template');
        formData.append('template_name', currentTemplateId);
        formData.append('template_content', content);
        formData.append('nonce', sipAjax.nonce);
    
        ajax.handleAjaxAction('template_editor', formData);
    }

    // Close editor
    function closeEditor() {
        $('#template-editor-overlay').removeClass('active').hide();
    }
    
    // Handle editor close with save check
    function handleJsonEditorClose() {
        if (jsonEditorHasChanges) {
            const dialog = $(`
                <div class="sip-dialog">
                    <p>You have unsaved changes. Would you like to save before closing?</p>
                    <div class="dialog-buttons">
                        <button class="save-close">Save and Close</button>
                        <button class="discard-close">Discard and Close</button>
                        <button class="cancel">Cancel</button>
                    </div>
                </div>
            `).dialog({
                modal: true,
                width: 400,
                closeOnEscape: true,
                dialogClass: 'sip-dialog',
                close: function() {
                    $(this).dialog('destroy').remove();
                }
            });
    
            dialog.find('.save-close').on('click', function() {
                handleJsonEditorSave(() => closeEditor());
                dialog.dialog('close');
            });
    
            dialog.find('.discard-close').on('click', function() {
                closeEditor();
                dialog.dialog('close');
            });
    
            dialog.find('.cancel').on('click', function() {
                dialog.dialog('close');
            });
        } else {
            closeEditor();
        }
    }

    /**
     * Set up resize functionality for the editor window
     */
    function setupResizeFunctionality(outerWindow, header, resizer) {
        function adjustEditors() {
            const containerHeight = outerWindow.offsetHeight - header.offsetHeight - resizer.offsetHeight;
            const halfHeight = containerHeight / 2;

            resizer.previousElementSibling.style.height = `${halfHeight}px`;
            resizer.nextElementSibling.style.height = `${halfHeight}px`;
            
            descriptionEditor.setSize(null, halfHeight - 30);
            jsonEditor.setSize(null, halfHeight - 30);
            
            descriptionEditor.refresh();
            jsonEditor.refresh();
        }

        // Resize handling
        let isResizing = false;
        let startY, startHeights;

        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startY = e.clientY;
            startHeights = {
                top: resizer.previousElementSibling.offsetHeight,
                bottom: resizer.nextElementSibling.offsetHeight
            };
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;

            const dy = e.clientY - startY;
            const containerHeight = outerWindow.offsetHeight - header.offsetHeight - resizer.offsetHeight;
            
            let newTopHeight = startHeights.top + dy;
            let newBottomHeight = startHeights.bottom - dy;

            if (newTopHeight > 50 && newBottomHeight > 50) {
                resizer.previousElementSibling.style.height = `${newTopHeight}px`;
                resizer.nextElementSibling.style.height = `${newBottomHeight}px`;
                
                descriptionEditor.setSize(null, newTopHeight - 30);
                jsonEditor.setSize(null, newBottomHeight - 30);
                
                descriptionEditor.refresh();
                jsonEditor.refresh();
            }
        });

        document.addEventListener('mouseup', function() {
            isResizing = false;
            document.body.style.userSelect = '';
        });

        // Initial setup
        adjustEditors();
        window.addEventListener('resize', adjustEditors);
    }

    /**
     * Set up toggle view functionality for the editor
     */
    function setupToggleView(toggleButton, renderedHtml, topEditorContainer) {
        let isRendered = false;
        toggleButton.addEventListener('click', () => {
            isRendered = !isRendered;
            if (isRendered) {
                renderedHtml.innerHTML = descriptionEditor.getValue();
                renderedHtml.style.display = 'block';
                topEditorContainer.style.display = 'none';
                toggleButton.textContent = 'View Code';
            } else {
                renderedHtml.style.display = 'none';
                topEditorContainer.style.display = 'block';
                toggleButton.textContent = 'View Rendered';
                descriptionEditor.refresh();
            }
        });
    }

    /**
     * Set up dragging functionality for the editor window
     */
    function setupDragging(header, outerWindow) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', function(e) {
            if (e.target === header) {
                isDragging = true;
                startX = e.clientX - outerWindow.offsetLeft;
                startY = e.clientY - outerWindow.offsetTop;
            }
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const newX = e.clientX - startX;
            const newY = e.clientY - startY;

            outerWindow.style.left = `${newX}px`;
            outerWindow.style.top = `${newY}px`;
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });
    }

    // Expose the init function
    return {
        init: init,
        initializeEditors: initializeEditors,
        handleSuccessResponse: handleSuccessResponse,
        get jsonEditor() { return jsonEditor; },
        get descriptionEditor() { return descriptionEditor; }
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('template_editor', sip.templateEditor.handleSuccessResponse);
