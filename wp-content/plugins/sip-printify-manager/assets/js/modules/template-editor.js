// template-editor.js

var sip = sip || {};

sip.templateEditor = (function($, ajax, utilities) {
    // Global variables for CodeMirror editors
    let descriptionEditor, jsonEditor;
    let jsonEditorHasChanges = false;

//updated save and close actions to integrate
    // // JSON Editor handlers
    // function handleJsonEditorSave() {
    //     const formData = new FormData();
    //     formData.append('action', 'sip_handle_ajax_request');
    //     formData.append('action_type', 'creation_action');
    //     formData.append('creation_action', 'save_json_editor_changes');
    //     formData.append('template_name', currentTemplateId);
    //     formData.append('template_data', sip.templateEditor.jsonEditor.getValue());
    //     formData.append('nonce', sipAjax.nonce);
        
    //     sip.ajax.handleAjaxAction('creation_action', formData);
    // }

    // function handleJsonEditorClose() {
    //     if (jsonEditorHasChanges) {
    //         const shouldSave = confirm('You have unsaved changes in the JSON editor. Would you like to save before closing?');
    //         if (shouldSave) {
    //             handleJsonEditorSave();
    //         }
    //     }

    //     const formData = new FormData();
    //     formData.append('action', 'sip_handle_ajax_request');
    //     formData.append('action_type', 'creation_action');
    //     formData.append('creation_action', 'close_json_editor');
    //     formData.append('nonce', sipAjax.nonce);
        
    //     sip.ajax.handleAjaxAction('creation_action', formData);
    // }



    /**
     * Initialize the template editor functionality
     */
    function init() {
        initializeTemplateEditor();
    }

    /**
     * Set up the template editor, including event listeners and editor initialization
     */
    function initializeTemplateEditor() {
        // Editor elements
        const outerWindow = document.getElementById('template-editor-outer-window');
        const header = document.getElementById('template-editor-header');
        const resizer = document.getElementById('template-editor-resizer');
        const toggleButton = document.getElementById('template-editor-toggle-view');
        const topEditorContainer = document.getElementById('template-editor-top-editor');
        const bottomEditorContainer = document.getElementById('template-editor-bottom-editor');
        const renderedHtml = document.getElementById('template-editor-rendered-html');

        /**
         * Initialize CodeMirror editors
         * @param {string} content - The content to be loaded into the editors
         */
        function initializeEditors(content) {
            const separatedContent = separateContent(content);

            // Initialize editors with equal heights
            const totalHeight = outerWindow.clientHeight - header.clientHeight - resizer.clientHeight;
            const halfHeight = totalHeight / 2;

            // Initialize description editor
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

            // Initialize JSON editor
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
                },
                foldOptions: {}
            });

            // Set initial sizes for editors
            descriptionEditor.setSize(null, halfHeight);
            jsonEditor.setSize(null, halfHeight);

            // Set up resize functionality
            setupResizeFunctionality(outerWindow, header, resizer, descriptionEditor, jsonEditor);

            // Set up toggle view functionality
            setupToggleView(toggleButton, renderedHtml, topEditorContainer, descriptionEditor);

            // Set up dragging functionality
            setupDragging(header, outerWindow);
        }

        // Event listener for opening the template editor
        $('.edit-template-content').on('click', function () {
            var templateName = $(this).closest('tr').find('.template-name-cell').data('template-name');
            $('#template-editor-overlay').show().addClass('active');
            $('#template-editor-header span').text('Edit Template: ' + templateName);

            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'template_editor');
            formData.append('template_editor', 'editor_edit_template');
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
                            var separatedContent = separateContent(content);
                            descriptionEditor.setValue(separatedContent.html);
                            jsonEditor.setValue(separatedContent.json);

                            // Force refresh after updating content
                            setTimeout(() => {
                                descriptionEditor.refresh();
                                jsonEditor.refresh();
                            }, 0);
                        }
                    } else {
                    }
                },
                function(error) {
                }
            );
        });

        // Event listener for closing the template editor
        $('#template-editor-close').on('click', function() {
            $('#template-editor-overlay').removeClass('active').one('transitionend', function() {
                $(this).hide();
            });
        });

        // Event listener for saving the template
        $('#template-editor-save').on('click', function() {
            var templateName = $('#template-editor-header span').text().replace('Edit Template: ', '');
            var descriptionContent = descriptionEditor.getValue();
            var jsonContent = jsonEditor.getValue();

            try {
                var parsedJson = JSON.parse(jsonContent);
                parsedJson.description = descriptionContent;
                var finalContent = JSON.stringify(parsedJson);

                var formData = new FormData();
                formData.append('action', 'sip_handle_ajax_request');
                formData.append('action_type', 'template_editor');
                formData.append('template_editor', 'editor_save_template');               
                formData.append('template_name', templateName);
                formData.append('template_content', finalContent);
                formData.append('nonce', sipAjax.nonce);

                sip.ajax.handleAjaxAction('template_editor', formData, 
                    function(response) {
                        if (response.success) {
                            $('#template-editor-overlay').removeClass('active').one('transitionend', function() {
                                $(this).hide();
                            });
                        } else {
                        }
                    },
                    function(error) {
                    }
                );
            } catch (e) {
                console.error('Error re-integrating content:', e);
            }
        });
    }

    // /**
    //  * Separate the template content into HTML and JSON parts
    //  * @param {string} content - The full template content
    //  * @return {Object} An object containing separated html and json content
    //  */
    // function separateContent(content) {
    //     try {
    //         var parsedContent = JSON.parse(content);
    //         var description = parsedContent.description || '';
    //         delete parsedContent.description;
    //         return {
    //             html: description,
    //             json: JSON.stringify(parsedContent, null, 2)
    //         };
    //     } catch (e) {
    //         console.error('Error separating content:', e);
    //         return { html: '', json: content };
    //     }
    // }

    /**
     * Set up resize functionality for the editor window
     */
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

        let adjustEditorsRAF;
        function adjustEditors() {
            cancelAnimationFrame(adjustEditorsRAF);
            adjustEditorsRAF = requestAnimationFrame(() => {
                const containerHeight = outerWindow.offsetHeight - header.offsetHeight - resizer.offsetHeight;
                const halfHeight = containerHeight / 2;

                descriptionEditor.setSize(null, halfHeight - 30);
                jsonEditor.setSize(null, halfHeight - 30);

                descriptionEditor.refresh();
                jsonEditor.refresh();
            });
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

    /**
     * Set up toggle view functionality for the editor
     */
    function setupToggleView(toggleButton, renderedHtml, topEditorContainer, descriptionEditor) {
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
            }
            descriptionEditor.refresh();
        });
    }

    /**
     * Set up dragging functionality for the editor window
     */
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

    // Expose the init function
    return {
        init: init,
        initializeTemplateEditor: initializeTemplateEditor
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('template_editor', sip.templateEditor.handleSuccessResponse);
