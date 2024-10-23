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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////TEMPLATE EDITOR FUNCTIONS///////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

        // Add toggle view functionality
        const toggleButton = document.getElementById('template-editor-toggle-view');
        const renderedHtml = document.getElementById('template-editor-rendered-html');
        const topEditorContainer = document.getElementById('template-editor-top-editor');
        
        let isRendered = false;
        toggleButton.addEventListener('click', () => {
            isRendered = !isRendered;
            if (isRendered) {
                renderedHtml.innerHTML = sip.templateEditor.descriptionEditor.getValue();
                renderedHtml.style.display = 'block';
                topEditorContainer.style.display = 'none';
                toggleButton.textContent = 'View Code';
            } else {
                renderedHtml.style.display = 'none';
                topEditorContainer.style.display = 'block';
                toggleButton.textContent = 'View Rendered';
                requestAnimationFrame(() => {
                    sip.templateEditor.descriptionEditor.refresh();
                });
            }
        });

        // Set initial states
        renderedHtml.style.display = 'none';
        toggleButton.textContent = 'View Rendered';

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
        requestAnimationFrame(() => {
            sip.templateEditor.descriptionEditor.refresh();
            sip.templateEditor.jsonEditor.refresh();
        });
    }
    utilities.hideSpinner();
}

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
    let scaleRAF;
    let lastScaleUpdate = 0;
    let resizeTimeout; // Single declaration here

    // Cache DOM measurements
    let cachedDimensions = {
        headerHeight: header.clientHeight,
        resizerHeight: resizer.clientHeight,
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth
    };

    // Debounce editor refreshes
    let refreshTimeout;
    function debouncedRefresh() {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                descriptionEditor.refresh();
                jsonEditor.refresh();
            });
        }, 16);
    }

    function adjustModalSize() {
        requestAnimationFrame(() => {
            const modalWidth = cachedDimensions.windowWidth * 0.8;
            const modalHeight = cachedDimensions.windowHeight * 0.8;

            // Batch DOM updates
            outerWindow.style.cssText = `
                width: ${modalWidth}px;
                height: ${modalHeight}px;
                left: ${(cachedDimensions.windowWidth - modalWidth) / 2}px;
                top: ${(cachedDimensions.windowHeight - modalHeight) / 2}px;
            `;

            adjustEditors();
        });
    }

    let adjustEditorsRAF;
    function adjustEditors() {
        cancelAnimationFrame(adjustEditorsRAF);
        adjustEditorsRAF = requestAnimationFrame(() => {
            const containerHeight = outerWindow.offsetHeight - cachedDimensions.headerHeight - cachedDimensions.resizerHeight;
            const halfHeight = containerHeight / 2;

            // Batch DOM updates
            resizer.previousElementSibling.style.height = `${halfHeight}px`;
            resizer.nextElementSibling.style.height = `${halfHeight}px`;

            descriptionEditor.setSize(null, halfHeight - 30);
            jsonEditor.setSize(null, halfHeight - 30);
            debouncedRefresh();
        });
    }

    window.addEventListener('resize', () => {
        cachedDimensions.windowHeight = window.innerHeight;
        cachedDimensions.windowWidth = window.innerWidth;
        adjustModalSize();
    }, { passive: true });

    // Initial adjustment
    adjustModalSize();

    // Vertical resizing functionality
    let isResizerDragging = false;
    let startResizerY, startTopHeight;
    let lastResizeUpdate = 0;

    resizer.addEventListener('mousedown', initResize, { passive: false });
    document.addEventListener('mousemove', resize, { passive: false });
    document.addEventListener('mouseup', stopResize, { passive: true });

    function initResize(e) {
        e.preventDefault();
        isResizerDragging = true;
        startResizerY = e.clientY;
        startTopHeight = resizer.previousElementSibling.offsetHeight;
        document.body.classList.add('resizing');
        
        // Prevent text selection during resize
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
        
        // Disable CodeMirror scrolling
        descriptionEditor.setOption('readOnly', true);
        jsonEditor.setOption('readOnly', true);
    }

    let resizeRAF;
    function resize(e) {
        if (!isResizerDragging) return;
        e.preventDefault();
        e.stopPropagation();

        // Prevent any scrolling during resize
        if (e.target.closest('.CodeMirror-scroll')) {
            e.target.closest('.CodeMirror-scroll').scrollTop = 0;
        }

        // Throttle updates
        const now = Date.now();
        if (now - lastResizeUpdate < 16) return;
        lastResizeUpdate = now;

        cancelAnimationFrame(resizeRAF);
        resizeRAF = requestAnimationFrame(() => {
            const difference = e.clientY - startResizerY;
            const newTopHeight = startTopHeight + difference;
            const containerHeight = outerWindow.offsetHeight - cachedDimensions.headerHeight - cachedDimensions.resizerHeight;

            if (newTopHeight > 0 && newTopHeight < containerHeight) {
                // Batch DOM updates
                resizer.previousElementSibling.style.cssText = `height: ${newTopHeight}px`;
                resizer.nextElementSibling.style.cssText = `height: ${containerHeight - newTopHeight}px`;
                
                descriptionEditor.setSize(null, newTopHeight - 30);
                jsonEditor.setSize(null, containerHeight - newTopHeight - 30);
            }
        });
    }

    function stopResize() {
        if (!isResizerDragging) return;
        isResizerDragging = false;
        document.body.classList.remove('resizing');
        
        // Re-enable text selection and restore cursor
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Re-enable CodeMirror scrolling
        descriptionEditor.setOption('readOnly', false);
        jsonEditor.setOption('readOnly', false);
        
        // Refresh editors
        requestAnimationFrame(() => {
            descriptionEditor.refresh();
            jsonEditor.refresh();
        });
    }

    const resizeObserver = new ResizeObserver(() => {
        if (isResizerDragging) return; // Don't interfere with manual resizing
    
        // Get current position and scale before adjustment
        const style = window.getComputedStyle(outerWindow);
        const existingTransform = style.transform;
        
        // Perform size adjustments in a single frame
        requestAnimationFrame(() => {
            const containerHeight = outerWindow.offsetHeight;
            const halfHeight = (containerHeight - header.offsetHeight - resizer.offsetHeight) / 2;
    
            // Set editor sizes first
            descriptionEditor.setSize(null, halfHeight - 30);
            jsonEditor.setSize(null, halfHeight - 30);
    
            // Set container heights
            resizer.previousElementSibling.style.height = `${halfHeight}px`;
            resizer.nextElementSibling.style.height = `${halfHeight}px`;
    
            // Restore transform if it existed
            if (existingTransform && existingTransform !== 'none') {
                outerWindow.style.transform = existingTransform;
            }
        });
    });

    resizeObserver.observe(outerWindow);

    // Clean up previous observer if it exists
    return () => {
        resizeObserver.disconnect();
    };
}

function setupDragging(header, outerWindow) {
    let isDragging = false;
    let startX, startY;
    let currentTransform = {
        x: 0,
        y: 0,
        scale: 1
    };

    // Get current transform values
    function getTransform() {
        const style = window.getComputedStyle(outerWindow);
        const transform = style.transform;
        if (transform && transform !== 'none') {
            const match = transform.match(/scale\(([^)]+)\)/);
            if (match) {
                currentTransform.scale = parseFloat(match[1]);
            }
        }
        return currentTransform;
    }

    header.addEventListener("mousedown", dragStart, { passive: true });
    document.addEventListener("mousemove", drag, { passive: false });
    document.addEventListener("mouseup", dragEnd, { passive: true });

    function dragStart(e) {
        if (e.target === header) {
            isDragging = true;
            startX = e.clientX - currentTransform.x;
            startY = e.clientY - currentTransform.y;
            getTransform(); // Update current transform state
            outerWindow.style.transition = 'none';
        }
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();

        requestAnimationFrame(() => {
            currentTransform.x = e.clientX - startX;
            currentTransform.y = e.clientY - startY;
            
            outerWindow.style.transform = `translate3d(${currentTransform.x}px, ${currentTransform.y}px, 0) scale(${currentTransform.scale})`;
        });
    }

    function dragEnd() {
        isDragging = false;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////PRODUCT CREATION TABLE FUNCTIONS////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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