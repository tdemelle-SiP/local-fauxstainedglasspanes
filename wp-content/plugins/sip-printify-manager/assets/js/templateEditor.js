// templateEditor.js

var sip = sip || {};

sip.templateEditor = (function($) {
    function init() {
        // Handle inline renaming
        $('.rename-template').on('click', function() {
            var $cell = $(this).closest('tr').find('.template-name-cell');
            var oldName = $cell.data('template-name');
            var $input = $('<input type="text" class="rename-input" />').val(oldName);

            $cell.empty().append($input);
            $input.focus();

            $input.on('blur keyup', function(e) {
                if (e.type === 'blur' || e.keyCode === 13) {
                    var newName = $input.val();

                    if (newName && newName !== oldName) {
                        var formData = new FormData();
                        formData.append('action', 'sip_handle_ajax_request');
                        formData.append('action_type', 'template_action');
                        formData.append('template_action', 'rename_template');
                        formData.append('old_template_name', oldName);
                        formData.append('new_template_name', newName);
                        formData.append('nonce', sipAjax.nonce);

                        $.ajax({
                            url: sipAjax.ajax_url,
                            method: 'POST',
                            data: formData,
                            processData: false,
                            contentType: false,
                            success: function(response) {
                                if (response.success) {
                                    $cell.text(newName).data('template-name', newName);
                                } else {
                                    alert('Error: ' + response.data);
                                    $cell.text(oldName);
                                }
                            },
                            error: function(xhr, status, error) {
                                alert('AJAX Error: ' + error);
                                $cell.text(oldName);
                            }
                        });
                    } else {
                        $cell.text(oldName);
                    }
                }
            });
        });

        // Template editor functionality
        initializeTemplateEditor($);
    }

    function initializeTemplateEditor($) {
        let descriptionEditor, jsonEditor;

        function initializeEditors(content) {
            const outerWindow = document.getElementById('template-editor-outer-window');
            const header = document.getElementById('template-editor-header');
            const resizer = document.getElementById('template-editor-resizer');
            const toggleButton = document.getElementById('template-editor-toggle-view');
            const topEditorContainer = document.getElementById('template-editor-top-editor');
            const bottomEditorContainer = document.getElementById('template-editor-bottom-editor');
            const renderedHtml = document.getElementById('template-editor-rendered-html');

            const separatedContent = separateContent(content);

            // Initialize editors with equal heights
            const totalHeight = outerWindow.clientHeight - header.clientHeight - resizer.clientHeight;
            const halfHeight = totalHeight / 2;

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
                },
                foldOptions: {
                    // You can specify options for code folding here
                }
            });


            // Set initial sizes for editors
            descriptionEditor.setSize(null, halfHeight);
            jsonEditor.setSize(null, halfHeight);

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

            // Toggle view functionality
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
                adjustEditors();
            });

            // Dragging functionality
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

        function separateContent(content) {
            try {
                var parsedContent = JSON.parse(content);
                var description = parsedContent.description || '';
                delete parsedContent.description;
                return {
                    html: description,
                    json: JSON.stringify(parsedContent, null, 2)
                };
            } catch (e) {
                console.error('Error separating content:', e);
                return { html: '', json: content };
            }
        }

        $('.edit-template-content').on('click', function () {
            var templateName = $(this).closest('tr').find('.template-name-cell').data('template-name');
            $('#template-editor-overlay').show().addClass('active');
            $('#template-editor-header span').text('Edit Template: ' + templateName);

            var formData = new FormData();
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'template_action');
            formData.append('template_action', 'edit_template');
            formData.append('template_name', templateName);
            formData.append('nonce', sipAjax.nonce);

            $.ajax({
                url: sipAjax.ajax_url,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
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
                        alert('Error: ' + response.data);
                    }
                },
                error: function (xhr, status, error) {
                    alert('AJAX Error: ' + error);
                }
            });
        });

        $('#template-editor-close').on('click', function() {
            $('#template-editor-overlay').removeClass('active').one('transitionend', function() {
                $(this).hide();
            });
        });
    

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
                formData.append('action_type', 'save_template');
                formData.append('template_name', templateName);
                formData.append('template_content', finalContent);
                formData.append('nonce', sipAjax.nonce);

                $.ajax({
                    url: sipAjax.ajax_url,
                    method: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        if (response.success) {
                            alert('Template saved successfully.');
                            $('#template-editor-overlay').removeClass('active').one('transitionend', function() {
                                $(this).hide();
                            });
                        } else {
                            alert('Error: ' + response.data);
                        }
                    },
                    error: function (xhr, status, error) {
                        alert('AJAX Error: ' + error);
                    }
                });
            } catch (e) {
                console.error('Error re-integrating content:', e);
                alert('There was an error saving your template. Please check your JSON syntax.');
            }
        });
    }

    // Expose the init function
    return {
        init: init
    };
})(jQuery);
