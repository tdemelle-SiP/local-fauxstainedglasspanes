// assets/js/sip-ajax.js

/**
 * SIP Printify Manager JavaScript
 *
 * This file contains the JavaScript code that handles AJAX interactions,
 * form submissions, and user interface behaviors for the SIP Printify Manager plugin.
 */


jQuery(document).ready(function ($) {
    // Hide the spinner once the entire page has fully loaded
    window.addEventListener('load', function() {
        $('#spinner-overlay').hide();
    });

    // Store the original content of the template editor for reverting changes
    var originalContent = '';

    // Add tooltip and pointer cursor to thumbnail images
    $('#image-list tr td:first-child img').each(function() {
        var fullTitle = $(this).attr('alt');
        if (fullTitle) {
            $(this).attr('title', fullTitle);
            $(this).css('cursor', 'pointer');
        }
    });

    /**
     * Reusable function to handle AJAX requests for various actions.
     * This function sends AJAX requests to the server and handles the response.
     *
     * @param {string} actionType - The type of action to perform (e.g., 'save_token', 'product_action', etc.).
     * @param {FormData} formData - The form data to send in the AJAX request.
     * @param {string|null} buttonSelector - The jQuery selector for the button to disable/enable during the request.
     * @param {string|null} spinnerSelector - The jQuery selector for the spinner to show/hide during the request.
     */

    function handleAjaxAction(actionType, formData = null, buttonSelector = null, spinnerSelector = null) {
        // This function is called when an option is selected from a dropdown or a button is clicked to perform an action.
        // When an option from a dropdown is selected, the form data is collected and sent to the server via AJAX to perform the action.
        // The server processes the request and sends a response back to the client.
        // The client-side JavaScript then handles the response and updates the UI accordingly.

        // When the button is clicked, it is disabled to prevent multiple clicks while the request is being processed.
        if (buttonSelector) {
            $(buttonSelector).attr('disabled', true);
        }
        // A spinner is shown to indicate that the request is being processed.
        if (spinnerSelector) {
            $(spinnerSelector).show();
            $('#spinner-overlay').show();
        }

        // After the button is disabled and the spinner is shown, the AJAX request is sent to the server.
        // The type of action is specified in the form data, along with other necessary information.
        // The form data contains the following elements: action, action_type, nonce, and any additional data needed for the action.
        // for example the delete Template action form data would look like this: action: 'sip_handle_ajax_request', action_type: 'template_action', template_action: 'delete_template', nonce: sipAjax.nonce, selected_templates[]: [template_id].
        
        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false, // Don't process the files (important for file uploads)
            contentType: false, // Let jQuery set the content type

        // When the server responds, the success function is called based on the response and the action type.
        // The response contains information about the success or failure of the action, along with any data needed to update the UI.
        // The success function handles the response and updates the UI accordingly.
        // If there is an error, the error function is called to handle the error and update the UI accordingly.

            success: function (response) {
                // Re-enable the button
                if (buttonSelector) {
                    $(buttonSelector).attr('disabled', false);
                }
                // Hide the spinner
                if (spinnerSelector) {
                    $(spinnerSelector).hide();
                }

                // Handle the response based on the action type
                // a switch statement is a good way to handle multiple cases based on the action type.
                if (response.success) {
                    switch (actionType) {
                        case 'save_token':
                            // Reload the page to show the shop page
                            location.reload();
                            break;

                        case 'new_token':
                            // Reload the page to show the auth page
                            location.reload();
                            break;

                        case 'product_action':
                            // Update the product list and template list if available
                            if (response.data.product_list_html) {
                                $('#product-list').html(response.data.product_list_html).show();
                            }
                            if (response.data.template_list_html) {
                                $('#template-list').html(response.data.template_list_html).show();
                            }
                            // Uncheck all selected products
                            $('input[name="selected_products[]"]').prop('checked', false);
                            // Uncheck the select all checkbox
                            $('#select-all-products').prop('checked', false);
                            $('#spinner-overlay').hide(); // Hide spinner overlay after update
                            break;

                        case 'template_action':
                            // Handle editing a template
                            if (formData.get('template_action') === 'edit_template') {
                                if (response.data && response.data.template_content) {
                                    $('#editing-template-name').text(response.data.template_name);
                                    $('#template-content').val(response.data.template_content);
                                    originalContent = response.data.template_content;
                                    $('#template-editor').show();
                                } else {
                                    alert('Error: Template content not found');
                                }
                            } else {
                                // Update the template list
                                if (response.data.template_list_html) {
                                    $('#template-list').html(response.data.template_list_html).show();
                                }
                                $('input[name="selected_templates[]"]').prop('checked', false);
                                // Uncheck the select all checkbox
                                $('#select-all-templates').prop('checked', false);
                            }
                            $('#spinner-overlay').hide(); // Hide spinner overlay after update
                            break;

                        case 'save_template':
                            // Template saved successfully
                            $('#template-editor').hide();
                            $('#spinner-overlay').hide(); // Hide spinner overlay after saving
                            break;

                        case 'image_action':
                            // Update the image list if available
                            if (response.data.image_list_html) {
                                $('#image-list').html(response.data.image_list_html).show();
                            }
                            // Uncheck all selected images
                            $('input[name="selected_images[]"]').prop('checked', false);
                            // Uncheck the select all checkbox
                            $('#select-all-images').prop('checked', false);
                            $('#spinner-overlay').hide(); // Hide spinner overlay after update
                            break;
    
                        case 'upload_images':
                            // Images uploaded successfully
                            if (response.data.image_list_html) {
                                $('#image-list').html(response.data.image_list_html).show();
                            }
                            // Clear the file input
                            $('#image-file-input').val('');
                            $('#spinner-overlay').hide(); // Hide spinner overlay after upload
                            break;

                        default:
                            $('#spinner-overlay').hide(); // Hide spinner overlay on error
                    }
                } else {
                    // Handle errors
                    $('#spinner-overlay').hide(); // Hide spinner overlay on error
                }
            },
            error: function () {
                // Re-enable the button and hide spinner on error
                if (buttonSelector) {
                    $(buttonSelector).attr('disabled', false);
                }
                if (spinnerSelector) {
                    $(spinnerSelector).hide();
                }
                $('#spinner-overlay').hide(); // Hide global spinner overlay on error
            }
        });
    }

    
    // For page load spinner
    document.addEventListener('DOMContentLoaded', function() {
        const spinnerSelector = '#spinner-overlay';  // Define your spinner selector here
        $(spinnerSelector).show();  // Show spinner when the page starts loading
    });

    window.addEventListener('load', function() {
        const spinnerSelector = '#spinner-overlay';  // Define your spinner selector here
        $(spinnerSelector).hide();  // Hide spinner once the page is fully loaded
    });


    /**
     * When the user pushes a button or makes a selection from a pulldown menu, a form submission event is triggered.
     * 
    * The following code handles form submissions for various actions.
    * It attaches an event handler to the form submission event and prevents the default form submission behavior.
     */
    $('#save-token-form, #product-action-form, #template-action-form, #image-action-form').on('submit', function (e) {
        e.preventDefault(); // Prevent default form submission

        // Create a new FormData object from the submitted form
        var formData = new FormData(this);
        var actionType = ''; // Initialize the action type variable

        /**
         * Determine the action type based on the form's ID.
         * The form ID indicates which form was submitted, allowing us to handle different actions.
         * Action types include saving the token, updating products, templates, or images, and uploading images.
         */
        switch ($(this).attr('id')) {
            case 'save-token-form':
                actionType = 'save_token';
                break;

            //PRODUCTS    
            case 'product-action-form':
                actionType = 'product_action';
                // Collect selected products from checkboxes
                var selectedProducts = [];
                $('input[name="selected_products[]"]:checked').each(function () {
                    selectedProducts.push($(this).val());
                });
                // Remove any existing 'selected_products[]' entries to avoid duplicates
                formData.delete('selected_products[]');
                // Append each selected product to formData
                selectedProducts.forEach(function (productId) {
                    formData.append('selected_products[]', productId);
                });
                break;

            //TEMPLATES
            case 'template-action-form':
                actionType = 'template_action';
                // Collect selected templates
                var selectedTemplates = [];
                $('input[name="selected_templates[]"]:checked').each(function () {
                    selectedTemplates.push($(this).val());
                });
                formData.delete('selected_templates[]');
                selectedTemplates.forEach(function (templateId) {
                    formData.append('selected_templates[]', templateId);
                });
                break;

            //IMAGES
            case 'image-action-form':
                actionType = 'image_action';
                // Collect selected images
                var selectedImages = [];
                $('input[name="selected_images[]"]:checked').each(function () {
                    selectedImages.push($(this).val());
                });
                formData.delete('selected_images[]');
                selectedImages.forEach(function (imageId) {
                    formData.append('selected_images[]', imageId);
                });
                break;

            default:
                alert('Unknown form action.');
                return; // Exit the function if the form ID is unrecognized       
        }

        // Append common data to formData for the AJAX request
        formData.append('action', 'sip_handle_ajax_request'); // WordPress AJAX action hook
        formData.append('action_type', actionType); // Specific action to perform
        formData.append('nonce', sipAjax.nonce); // Security nonce

        // Call the reusable function to handle the AJAX request
        handleAjaxAction(actionType, formData, null, '#loading-spinner');
    });

    /**
     * Handle New Store Token button click.
     * Sends an AJAX request to reset the token and reloads the page.
     */
    $('#new-token-button').on('click', function (e) {
        e.preventDefault();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'new_token');
        formData.append('nonce', sipAjax.nonce);

        handleAjaxAction('new_token', formData, '#new-token-button', '#loading-spinner');
    });



///////////////////////////////////////////RENAME TEMPLATE////////////////////////////////////////

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
                    formData.append('sip_printify_manager_nonce_field', sipAjax.nonce); // Add nonce field
                    formData.append('_wp_http_referer', '/wp-admin/admin.php?page=sip-printify-manager'); // Add referer field
                    formData.append('template_action', 'rename_template'); // Add template action field
                    formData.append('old_template_name', oldName);
                    formData.append('new_template_name', newName);
                    formData.append('action', 'sip_handle_ajax_request');
                    formData.append('action_type', 'template_action');
                    formData.append('nonce', sipAjax.nonce); // Add nonce again for consistency
    
                    $.ajax({
                        url: sipAjax.ajax_url,
                        method: 'POST',
                        data: formData,
                        processData: false, // Important for FormData
                        contentType: false, // Important for FormData
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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////TEMPLATE EDITOR////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

jQuery(document).ready(function($) {
    let descriptionEditor, jsonEditor;

    function initializeEditors(content) {
        const outerWindow = document.getElementById('product-editor-outer-window');
        const header = document.getElementById('product-editor-header');
        const resizer = document.getElementById('product-editor-resizer');
        const toggleButton = document.getElementById('product-editor-toggle-view');
        const topEditorContainer = document.getElementById('product-editor-top-editor');
        const bottomEditorContainer = document.getElementById('product-editor-bottom-editor');
        const renderedHtml = document.getElementById('product-editor-rendered-html');

        const separatedContent = separateContent(content);

        // Initialize editors with a fixed height initially
        descriptionEditor = wp.CodeMirror(topEditorContainer, {
            mode: 'htmlmixed',
            lineNumbers: true,
            lineWrapping: true,
            dragDrop: false,
            viewportMargin: Infinity,
            value: separatedContent.html,
            height: "300px" // Set an initial height
        });
    
        jsonEditor = wp.CodeMirror(bottomEditorContainer, {
            mode: 'application/json',
            lineNumbers: true,
            lineWrapping: true,
            dragDrop: false,
            viewportMargin: Infinity,
            value: separatedContent.json,
            height: "300px" // Set an initial height
        });

        // Function to properly size and refresh editors
        function adjustEditors() {
            const containerHeight = outerWindow.offsetHeight - header.offsetHeight - resizer.offsetHeight;
            const halfHeight = containerHeight / 2;
            
            descriptionEditor.setSize(null, halfHeight - 30);
            jsonEditor.setSize(null, halfHeight - 30);
            
            descriptionEditor.refresh();
            jsonEditor.refresh();
        }

        // Throttle function for performance
        function throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        }

        // Throttled version of adjustEditors
        const throttledAdjust = throttle(adjustEditors, 100);

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
            throttledAdjust();
        });

        // Dragging functionality
        let isDragging = false;
        let startX, startY;

        header.addEventListener("mousedown", (e) => {
            if (e.target === header) {
                isDragging = true;
                startX = e.clientX - outerWindow.offsetLeft;
                startY = e.clientY - outerWindow.offsetTop;
                outerWindow.style.cursor = 'grabbing';
            }
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            requestAnimationFrame(() => {
                outerWindow.style.left = `${e.clientX - startX}px`;
                outerWindow.style.top = `${e.clientY - startY}px`;
            });
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            outerWindow.style.cursor = '';
        });

        // Vertical resizing functionality
        let isResizing = false;
        let startHeight, resizeStartY;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeStartY = e.clientY;
            startHeight = topEditorContainer.offsetHeight;
            document.body.style.cursor = 'row-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            requestAnimationFrame(() => {
                const dy = e.clientY - resizeStartY;
                const newTopHeight = startHeight + dy;
                const bottomHeight = outerWindow.offsetHeight - newTopHeight - header.offsetHeight - resizer.offsetHeight;
                
                if (newTopHeight > 50 && bottomHeight > 50) {
                    topEditorContainer.style.height = `${newTopHeight}px`;
                    bottomEditorContainer.style.height = `${bottomHeight}px`;
                    descriptionEditor.setSize(null, newTopHeight);
                    jsonEditor.setSize(null, bottomHeight);
                }
            });
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                descriptionEditor.refresh();
                jsonEditor.refresh();
            }
        });

        // Use ResizeObserver for efficient window resizing
        new ResizeObserver(() => {
            requestAnimationFrame(() => {
                const topHeight = topEditorContainer.offsetHeight;
                const bottomHeight = bottomEditorContainer.offsetHeight;
                descriptionEditor.setSize(null, topHeight);
                jsonEditor.setSize(null, bottomHeight);
                descriptionEditor.refresh();
                jsonEditor.refresh();
            });
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
        $('#product-editor-header span').text('Edit Template: ' + templateName);

        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                action: 'sip_handle_ajax_request',
                action_type: 'template_action',
                template_action: 'edit_template',
                template_name: templateName,
                nonce: sipAjax.nonce
            },
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

    $('#product-editor-close').on('click', function() {
        $('#template-editor-overlay').removeClass('active').one('transitionend', function() {
            $(this).hide();
        });
    });

    $('#product-editor-save').on('click', function() {
        var templateName = $('#product-editor-header span').text().replace('Edit Template: ', '');
        var descriptionContent = descriptionEditor.getValue();
        var jsonContent = jsonEditor.getValue();

        try {
            var parsedJson = JSON.parse(jsonContent);
            parsedJson.description = descriptionContent;
            var finalContent = JSON.stringify(parsedJson);

            $.ajax({
                url: sipAjax.ajax_url,
                method: 'POST',
                data: {
                    action: 'sip_handle_ajax_request',
                    action_type: 'template_action',
                    template_action: 'save_template',
                    template_name: templateName,
                    template_content: finalContent,
                    nonce: sipAjax.nonce
                },
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
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////IMAGE UPLOAD FUNCTIONALITY////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Handle drag over event on the image upload area.
     * Prevents default behavior and adds a visual indication.
     */
    $('#image-upload-area').on('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('dragging');
    });

    /**
     * Handle drag leave event on the image upload area.
     * Removes the visual indication.
     */
    $('#image-upload-area').on('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');
    });

    /**
     * Handle drop event on the image upload area.
     * Prevents default behavior and processes the dropped files.
     */
    $('#image-upload-area').on('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');

        var files = e.originalEvent.dataTransfer.files;
        handleImageUpload(files);
    });

    /**
     * Trigger the hidden file input when the "Select Images" button is clicked.
     */
    $('#select-images-button').on('click', function (e) {
        e.preventDefault();
        $('#image-file-input').trigger('click');
    });

    /**
     * Handle file selection from the file input.
     * Processes the selected files.
     */
    $('#image-file-input').on('change', function (e) {
        var files = e.target.files;
        handleImageUpload(files);
    });

    /**
     * Function to handle image uploads via drag-and-drop or file selection.
     * Sends the images to the server via AJAX for processing.
     *
     * @param {FileList} files - The list of files selected or dropped by the user.
     */
    function handleImageUpload(files) {
        var formData = new FormData();
        $.each(files, function (i, file) {
            formData.append('images[]', file);
        });
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'upload_images');
        formData.append('nonce', sipAjax.nonce);

        // Show spinner overlay
        $('#spinner-overlay').show();

        // Send the AJAX request to upload images
        handleAjaxAction('upload_images', formData, null, null);
    }

    ///////////////////////////////SELECT ALL AND SEARCH FUNCTIONALITY////////////////////////////////////////

    /**
     * Select All / Deselect All functionality for images.
     * When the select-all checkbox is changed, all individual image checkboxes are set accordingly.
     */
    $(document).on('change', '#select-all-images', function () {
        var isChecked = $(this).is(':checked');
        $('input[name="selected_images[]"]').prop('checked', isChecked);
    });

    /**
     * Ensure that if any individual image checkbox is unchecked, the select-all checkbox is also unchecked.
     */
    $(document).on('change', 'input[name="selected_images[]"]', function () {
        if (!$(this).is(':checked')) {
            $('#select-all-images').prop('checked', false);
        } else {
            // If all individual checkboxes are checked, check the select-all checkbox
            if ($('input[name="selected_images[]"]:checked').length === $('input[name="selected_images[]"]').length) {
                $('#select-all-images').prop('checked', true);
            }
        }
    });

    /**
     * Select All / Deselect All functionality for products.
     * When the select-all checkbox is changed, all individual product checkboxes are set accordingly.
     */
    $(document).on('change', '#select-all-products', function () {
        var isChecked = $(this).is(':checked');
        $('input[name="selected_products[]"]').prop('checked', isChecked);
    });

    /**
     * Ensure that if any individual product checkbox is unchecked, the select-all checkbox is also unchecked.
     */
    $(document).on('change', 'input[name="selected_products[]"]', function () {
        if (!$(this).is(':checked')) {
            $('#select-all-products').prop('checked', false);
        } else {
            // If all individual checkboxes are checked, check the select-all checkbox
            if ($('input[name="selected_products[]"]:checked').length === $('input[name="selected_products[]"]').length) {
                $('#select-all-products').prop('checked', true);
            }
        }
    });


    /**
     * Select All / Deselect All functionality for templates.
     * When the select-all checkbox is changed, all individual template checkboxes are set accordingly.
     */
    $(document).on('change', '#select-all-templates', function () {
        var isChecked = $(this).is(':checked');
        $('input[name="selected_templates[]"]').prop('checked', isChecked);
    });

    /**
     * Ensure that if any individual template checkbox is unchecked, the select-all checkbox is also unchecked.
     */
    $(document).on('change', 'input[name="selected_templates[]"]', function () {
        if (!$(this).is(':checked')) {
            $('#select-all-templates').prop('checked', false);
        } else {
            // If all individual checkboxes are checked, check the select-all checkbox
            if ($('input[name="selected_templates[]"]:checked').length === $('input[name="selected_templates[]"]').length) {
                $('#select-all-templates').prop('checked', true);
            }
        }
    });

    /**
     * Search functionality for products.
     * Filters the products table based on the search input value
     */
    $('#product-search').on('keyup', function () {
        var value = $(this).val().toLowerCase();
        $('#product-list tbody tr').filter(function () {
            $(this).toggle($(this).find('td:nth-child(3)').text().toLowerCase().indexOf(value) > -1);
        });
    });
    
    /* Search functionality for images. */
    $('#image-search').on('keyup', function () {
        var value = $(this).val().toLowerCase();
        $('#image-list table tbody tr').filter(function () {
            // Check if the filename or other relevant text in the row contains the search term
            var rowText = $(this).text().toLowerCase();
            $(this).toggle(rowText.indexOf(value) > -1);
        });
    });

    /* Search functionality for templates. */
    $('#template-search').on('keyup', function () {
        var value = $(this).val().toLowerCase();
        $('#template-list tbody tr').filter(function () {
            $(this).toggle($(this).find('td:nth-child(2)').text().toLowerCase().indexOf(value) > -1);
        });
    });
    

});
