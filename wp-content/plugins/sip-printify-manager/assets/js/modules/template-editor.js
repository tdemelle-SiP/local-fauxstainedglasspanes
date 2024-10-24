// template-editor.js

var sip = sip || {};

sip.templateEditor = (function($, ajax, utilities) {
    // Module-level variables
    let descriptionEditor = null;
    let jsonEditor = null;
    let jsonEditorHasChanges = false;
    let currentTemplateId = null;

    function init() {
        initializeTemplateEditor();

        // Restore highlight from localStorage on page load
        const savedTemplate = localStorage.getItem('lastSelectedTemplate');
    }

    function setupEventListeners() {
            // Event listener for closing the template editor
            $('#template-editor-close').on('click', function() {
                if (jsonEditorHasChanges) {
                    const shouldSave = confirm('You have unsaved changes. Would you like to save before closing?');
                    if (shouldSave) {
                        handleJsonEditorSave(() => handleJsonEditorClose());
                    } else {
                        handleJsonEditorClose();
                    }
                } else {
                    handleJsonEditorClose();
                }
            });
    
            // Event listener for saving the template
            $('#template-editor-save').on('click', function() {
                handleJsonEditorSave();
            });
    };

    function initializeEditors(content) {
        const outerWindow = document.getElementById('template-editor-outer-window');
        const header = document.getElementById('template-editor-header');
        const resizer = document.getElementById('template-editor-resizer');
        const toggleButton = document.getElementById('template-editor-toggle-view');
        const topEditorContainer = document.getElementById('template-editor-top-editor');
        const bottomEditorContainer = document.getElementById('template-editor-bottom-editor');
        const renderedHtml = document.getElementById('template-editor-rendered-html');

        const separatedContent = utilities.separateTemplateContent(content);
        
        // Initialize editors
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

        // Set up change tracking
        jsonEditor.on('change', function() {
            jsonEditorHasChanges = true;
            $('#template-editor-save').addClass('has-changes');
        });

        descriptionEditor.on('change', function() {
            jsonEditorHasChanges = true;
            $('#template-editor-save').addClass('has-changes');
        });

        const totalHeight = outerWindow.clientHeight - header.clientHeight - resizer.clientHeight;
        const halfHeight = totalHeight / 2;

        // Initialize container sizes
        resizer.previousElementSibling.style.height = `${halfHeight}px`;
        resizer.nextElementSibling.style.height = `${halfHeight}px`;

        // Set editor sizes
        descriptionEditor.setSize(null, halfHeight - 30);
        jsonEditor.setSize(null, halfHeight - 30);

        // Set up editor functionality
        setupResizeFunctionality(outerWindow, header, resizer);
        setupToggleView(toggleButton, renderedHtml, topEditorContainer);
        setupDragging(header, outerWindow);

        // Refresh editors
        descriptionEditor.refresh();
        jsonEditor.refresh();

        // Initialize event listeners
        // initializeEventListeners();
    }

    function initializeTemplateEditor() {
        // Event listener for opening the template editor
        $('.edit-template-content').on('click', function () {
            var templateName = $(this).closest('tr').find('.template-name-cell').data('template-name');
            $('#template-editor-overlay').show().addClass('active');
            $('#template-editor-header span').text('Edit Template: ' + templateName);
            jsonEditorHasChanges = false;
            $('#template-editor-save').removeClass('has-changes');

            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'template_editor');
            formData.append('template_editor', 'json_editor_edit_template');
            formData.append('template_name', templateName);
            formData.append('nonce', sipAjax.nonce);

            sip.ajax.handleAjaxAction('template_editor', formData, 
                function(response) {
                    if (response.success) {
                        var content = response.data.template_content;

                        // Initialize editors with content
                        if (!descriptionEditor || !jsonEditor) {
                            initializeEditors(content);
                        } else {
                            // If editors already exist, update their content
                            var separatedContent = sip.utilities.separateTemplateContent(content);
                            descriptionEditor.setValue(separatedContent.html);
                            jsonEditor.setValue(separatedContent.json);

                            // Force refresh after updating content
                            setTimeout(() => {
                                descriptionEditor.refresh();
                                jsonEditor.refresh();
                            }, 0);
                        }
                    }
                },
                function(error) {
                    console.error('Error loading template:', error);
                }
            );
        });

        setupEventListeners();
    }

    function handleSuccessResponse(response) {
        if (response.success) {
            switch(response.data.action) {
                case 'json_editor_save':
                case 'json_editor_save_template':
                    jsonEditorHasChanges = false;
                    $('#template-editor-save').removeClass('has-changes');
                    break;
                case 'json_editor_close':
                    $('#template-editor-overlay').removeClass('active').hide();
                    utilities.hideSpinner();
                    break;
                default:
                    console.warn('Unhandled template editor action:', response.data.action);
            }
        } else {
            utilities.showToast('Error: ' + response.data, 5000);
        }
    }

    function handleJsonEditorSave(callback) {
        console.log('Saving template success handler... hello!..');
        const templateName = window.lastSelectedTemplate;
        const descriptionContent = descriptionEditor.getValue();
        const jsonContent = jsonEditor.getValue();

        try {
            const parsedJson = JSON.parse(jsonContent);
            parsedJson.description = descriptionContent;
            const finalContent = JSON.stringify(parsedJson);

            const formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'template_editor');
            formData.append('template_editor', 'json_editor_save_template');
            formData.append('template_name', templateName);
            formData.append('template_content', finalContent);
            formData.append('nonce', sipAjax.nonce);

            ajax.handleAjaxAction('template_editor', formData,
                function(response) {
                    if (response.success) {
                        jsonEditorHasChanges = false;
                        $('#template-editor-save').removeClass('has-changes');
                        if (callback) callback();
                    }
                },
                function(error) {
                    console.error('Error saving template:', error);
                }
            );
        } catch (e) {
            console.error('Error preparing content:', e);
        }
    }

    function handleJsonEditorClose() {
        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'template_editor');
        formData.append('template_editor', 'json_editor_close_template');
        formData.append('nonce', sipAjax.nonce);

        ajax.handleAjaxAction('template_editor', formData,
            function(response) {
                if (response.success) {
                    $('#template-editor-overlay').removeClass('active').hide();
                }
            },
            function(error) {
                console.error('Error closing editor:', error);
            }
        );
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
