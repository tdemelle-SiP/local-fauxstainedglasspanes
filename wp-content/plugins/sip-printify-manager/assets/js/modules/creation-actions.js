// creation-actions.js

var sip = sip || {};

sip.creationActions = (function($, ajax, utilities) {
    let selectedTemplateId = null;
    let isDirty = false; // Flag to track unsaved changes

    function init(templateData) {
        if (templateData && templateData.id) {
            selectedTemplateId = templateData.id;
            initializeCreationContainer();
        } else {
            console.log('No template data provided - creation-actions.js is checking for loaded template');
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

    function initializeCreationContainer() {
        $('#product-creation-container').show();
        $('#creation-table').html(sip.utilities.getInitialTableHtml());
    }

    function checkForLoadedTemplate() {
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
                case 'get_loaded_template':
                    handleGetLoadedTemplateSuccess(response.data);
                    break;
                case 'update_wip':
                    handleUpdateWipSuccess(response.data);
                    break;
                case 'create_product':
                    handleCreateProductSuccess(response.data);
                    break;
                case 'save_loaded_template':
                    handleSaveLoadedTemplateSuccess(response.data);
                    break;
                case 'save_template':
                    handleSaveTemplateSuccess(response.data);
                    break;
                case 'close_template':
                    handleCloseTemplateResponse(response.data);
                    console.log('***hidespinner called. Template closed successfully');
                    sip.utilities.hideSpinner();
                    break;
                case 'edit_json':
                    handleEditJsonSuccess(response.data);
                    break

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

    function handleEditJsonSuccess(data) {
        console.log('Initializing editors with template data:', data.template_data);
        
        const outerWindow = document.getElementById('template-editor-outer-window');
        const header = document.getElementById('template-editor-header');
        const resizer = document.getElementById('template-editor-resizer');
        
        // Initialize editors with equal heights
        const totalHeight = outerWindow.clientHeight - header.clientHeight - resizer.clientHeight;
        const halfHeight = totalHeight / 2;
        
        // Initialize editors with content
        if (!sip.templateEditor.descriptionEditor || !sip.templateEditor.jsonEditor) {
            const content = data.template_data;
            const separatedContent = separateContent(content);
            
            // Initialize description editor
            sip.templateEditor.descriptionEditor = wp.CodeMirror(document.getElementById('template-editor-top-editor'), {
                mode: 'htmlmixed',
                lineNumbers: true,
                lineWrapping: true,
                dragDrop: false,
                viewportMargin: Infinity,
                value: separatedContent.html,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
            });
    
            // Initialize JSON editor
            sip.templateEditor.jsonEditor = wp.CodeMirror(document.getElementById('template-editor-bottom-editor'), {
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
                },
                foldOptions: {}
            });
    
            // Set initial sizes for editors
            sip.templateEditor.descriptionEditor.setSize(null, halfHeight - 30);
            sip.templateEditor.jsonEditor.setSize(null, halfHeight - 30);
    
            // Set up resize functionality
            setupResizeFunctionality(outerWindow, header, resizer, sip.templateEditor.descriptionEditor, sip.templateEditor.jsonEditor);
            setupDragging(header, outerWindow);
        } else {
            // If editors already exist, update their content
            const separatedContent = separateContent(data.template_data);
            sip.templateEditor.descriptionEditor.setValue(separatedContent.html);
            sip.templateEditor.jsonEditor.setValue(separatedContent.json);
    
            // Force refresh after updating content
            setTimeout(() => {
                sip.templateEditor.descriptionEditor.refresh();
                sip.templateEditor.jsonEditor.refresh();
            }, 0);
        }
        utilities.hideSpinner();
    }

    // Add the separateContent function if it's not already there
    function separateContent(content) {
        try {
            var parsedContent = JSON.parse(JSON.stringify(content)); // Make a copy of the object
            var description = parsedContent.description || '';
            delete parsedContent.description;
            return {
                html: description,
                json: JSON.stringify(parsedContent, null, 2)
            };
        } catch (e) {
            console.error('Error separating content:', e);
            return { html: '', json: JSON.stringify(content) };
        }
    }

    function setupResizeFunctionality(outerWindow, header, resizer, descriptionEditor, jsonEditor) {
        // Function to adjust modal size and position
        function adjustModalSize() {
            requestAnimationFrame(() => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const modalWidth = windowWidth * 0.8;
                const modalHeight = windowHeight * 0.8;
    
                outerWindow.style.width = `${modalWidth}px`;
                outerWindow.style.height = `${modalHeight}px`;
                outerWindow.style.left = `${(windowWidth - modalWidth) / 2}px`;
                outerWindow.style.top = `${(windowHeight - modalHeight) / 2}px`;
    
                adjustEditors();
            });
        }
    
        function adjustEditors() {
            const containerHeight = outerWindow.offsetHeight - header.offsetHeight - resizer.offsetHeight;
            const halfHeight = containerHeight / 2;
        
            // Set the heights of the container elements
            resizer.previousElementSibling.style.height = `${halfHeight}px`;
            resizer.nextElementSibling.style.height = `${halfHeight}px`;
        
            descriptionEditor.setSize(null, halfHeight - 30);
            jsonEditor.setSize(null, halfHeight - 30);
        
            descriptionEditor.refresh();
            jsonEditor.refresh();
        }
    
        // Initial adjustment and window resize listener
        adjustModalSize();
        window.addEventListener('resize', adjustModalSize);
    
        // Vertical resizing functionality
        let isResizerDragging = false;
        let startResizerY, startTopHeight;
    
        resizer.addEventListener('mousedown', initResize);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    
        function initResize(e) {
            e.preventDefault();
            isResizerDragging = true;
            startResizerY = e.clientY;
            startTopHeight = resizer.previousElementSibling.offsetHeight;
            document.body.classList.add('resizing');
        }
    
        let resizeRAF;
        function resize(e) {
            if (!isResizerDragging) return;
    
            cancelAnimationFrame(resizeRAF);
            resizeRAF = requestAnimationFrame(() => {
                const difference = e.clientY - startResizerY;
                const newTopHeight = startTopHeight + difference;
                const containerHeight = outerWindow.offsetHeight - header.offsetHeight - resizer.offsetHeight;
    
                if (newTopHeight > 0 && newTopHeight < containerHeight) {
                    resizer.previousElementSibling.style.height = `${newTopHeight}px`;
                    resizer.nextElementSibling.style.height = `${containerHeight - newTopHeight}px`;
                    descriptionEditor.setSize(null, newTopHeight - 30);
                    jsonEditor.setSize(null, containerHeight - newTopHeight - 30);
                }
            });
        }
    
        function stopResize() {
            isResizerDragging = false;
            document.body.classList.remove('resizing');
            descriptionEditor.refresh();
            jsonEditor.refresh();
        }
    
        // Use ResizeObserver for efficient window resizing
        new ResizeObserver(() => {
            requestAnimationFrame(adjustEditors);
        }).observe(outerWindow);
    }

    function setupDragging(header, outerWindow) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
    
        header.addEventListener("mousedown", dragStart);
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", dragEnd);
    
        function dragStart(e) {
            if (e.target === header) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = outerWindow.offsetLeft;
                startTop = outerWindow.offsetTop;
                outerWindow.style.transition = 'none';
            }
        }
    
        let dragRAF;
        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            cancelAnimationFrame(dragRAF);
            dragRAF = requestAnimationFrame(() => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                outerWindow.style.left = `${startLeft + dx}px`;
                outerWindow.style.top = `${startTop + dy}px`;
            });
        }
    
        function dragEnd() {
            isDragging = false;
            outerWindow.style.transition = '';
        }
    }


    function handleSaveLoadedTemplateSuccess(data) {
        console.log('Template data saved successfully');
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

    function handleSaveLoadedTemplateSuccess(data) {
        console.log('Template data saved successfully');
    }

    function handleSaveTemplateSuccess(data) {
        console.log('Template saved successfully');
        isDirty = false;
    }

    function handleCloseTemplateResponse(data) {
        // Clear visual highlights
        $('#image-table-content tr').removeClass('created wip archived');
        $('#template-table-content tr').removeClass('wip');
        
        // Clear stored states
        window.lastSelectedTemplate = null;
        localStorage.removeItem('lastSelectedTemplate');
        localStorage.removeItem('sip_image_highlights');
        
        // Existing close functionality
        $('#creation-table-container').html(sip.utilities.getInitialTableHtml());
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
        checkForLoadedTemplate: checkForLoadedTemplate,
        closeTemplate: closeTemplate,
        saveTemplate: saveTemplate,
        isDirty: getDirtyState
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('creation_action', sip.creationActions.handleSuccessResponse);