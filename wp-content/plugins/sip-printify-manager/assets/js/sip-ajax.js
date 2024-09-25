// assets/js/sip-ajax.js

/**
 * SIP Printify Manager JavaScript
 *
 * This file contains the JavaScript code that handles AJAX interactions,
 * form submissions, and user interface behaviors for the SIP Printify Manager plugin.
 */

jQuery(document).ready(function ($) {
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

///////////////////////////////////////////TEMPLATE EDITOR////////////////////////////////////////

$(document).ready(function($) {
    var editorDescription, editorJSON;

    function initializeEditors() {
        if (typeof wp.codeEditor === 'undefined') {
            console.error('wp.codeEditor is not loaded.');
            return;
        }

        // Initialize the CodeMirror editor for the description (HTML)
        if (!editorDescription) {
            var descriptionSettings = wp.codeEditor.defaultSettings ? _.clone(wp.codeEditor.defaultSettings) : {};
            descriptionSettings.codemirror = _.extend({}, descriptionSettings.codemirror, {
                mode: 'htmlmixed',  // Use HTML mixed mode
                theme: 'default',
                lineNumbers: true
            });
            editorDescription = wp.codeEditor.initialize($('#description-editor-textarea'), descriptionSettings);
        }

        // Initialize the CodeMirror editor for JSON data
        if (!editorJSON) {
            var jsonSettings = wp.codeEditor.defaultSettings ? _.clone(wp.codeEditor.defaultSettings) : {};
            jsonSettings.codemirror = _.extend({}, jsonSettings.codemirror, {
                mode: 'application/json',  // Use JSON mode
                theme: 'default',
                lineNumbers: true
            });
            editorJSON = wp.codeEditor.initialize($('#json-editor-textarea'), jsonSettings);
        }
    }

    function resizeEditors() {
        if (editorDescription && typeof editorDescription.codemirror.refresh === 'function') {
            editorDescription.codemirror.refresh();
        }
        if (editorJSON && typeof editorJSON.codemirror.refresh === 'function') {
            editorJSON.codemirror.refresh();
        }
    }

    // Listen to the resize event on the modal
    var resizeObserver = new ResizeObserver(resizeEditors);
    resizeObserver.observe(document.getElementById('template-editor-content'));

    // Function to separate the description (HTML) from the rest of the JSON data
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

    // Open the modal and load the template content
    $('.edit-template-content').on('click', function() {
        var templateName = $(this).closest('tr').find('.template-name-cell').data('template-name');

        $('#template-editor-modal').show();
        $('#template-editor-title').text(templateName);

        // AJAX request to load the template content
        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                sip_printify_manager_nonce_field: sipAjax.nonce,
                _wp_http_referer: '/wp-admin/admin.php?page=sip-printify-manager',
                template_action: 'edit_template',
                template_name: templateName,
                action: 'sip_handle_ajax_request',
                action_type: 'template_action',
                nonce: sipAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    initializeEditors();
                    var content = response.data.template_content;

                    // Separate HTML description and JSON data
                    var separatedContent = separateContent(content);
                    editorDescription.codemirror.setValue(separatedContent.html); // Set HTML content in the HTML editor
                    editorJSON.codemirror.setValue(separatedContent.json); // Set JSON content in the JSON editor
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function(xhr, status, error) {
                alert('AJAX Error: ' + error);
            }
        });
    });

    // Close modal on cancel or close button click
    $('#template-editor-cancel, #template-editor-close').on('click', function() {
        $('#template-editor-modal').hide();
    });

    // Save the edited template
    $('#template-editor-save').on('click', function() {
        var templateName = $('#template-editor-title').text();
        var descriptionContent = editorDescription.codemirror.getValue();
        var jsonContent = editorJSON.codemirror.getValue();

        // Re-integrate HTML description back into JSON
        try {
            var parsedJson = JSON.parse(jsonContent);
            parsedJson.description = descriptionContent;
            var finalContent = JSON.stringify(parsedJson);
        } catch (e) {
            console.error('Error re-integrating content:', e);
            alert('There was an error saving your template.');
            return;
        }

        // AJAX request to save template content
        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                sip_printify_manager_nonce_field: sipAjax.nonce,
                _wp_http_referer: '/wp-admin/admin.php?page=sip-printify-manager',
                template_action: 'save_template',
                template_name: templateName,
                template_content: finalContent,
                action: 'sip_save_template_content'
            },
            success: function(response) {
                if (response.success) {
                    alert('Template saved successfully.');
                    $('#template-editor-modal').hide();
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function(xhr, status, error) {
                alert('AJAX Error: ' + error);
            }
        });
    });



    $('#template-editor-save').on('click', function () {
        var templateName = $('#template-editor-title').text();
        var templateContent = editorJson.codemirror.getValue();
        var descriptionContent = editorHtml.codemirror.getValue();

        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                sip_printify_manager_nonce_field: sipAjax.nonce,
                _wp_http_referer: '/wp-admin/admin.php?page=sip-printify-manager',
                template_action: 'save_template',
                template_name: templateName,
                template_content: templateContent,
                description: descriptionContent, // Ensure this is processed correctly
                action: 'sip_save_template_content'
            },
            success: function (response) {
                if (response.success) {
                    alert('Template saved successfully.');
                    $('#template-editor-modal').hide();
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function (xhr, status, error) {
                alert('AJAX Error: ' + error);
            }
        });
    });

    $('#template-editor-save').on('click', function() {
        var templateContent = {
            description: descriptionEditor.codemirror.getValue(),
            json: JSON.parse(jsonEditor.codemirror.getValue())
        };

        // Merge HTML description into JSON object
        templateContent.json.description = templateContent.description;

        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                sip_printify_manager_nonce_field: sipAjax.nonce,
                _wp_http_referer: '/wp-admin/admin.php?page=sip-printify-manager',
                template_action: 'save_template',
                template_name: $('#template-editor-title').text(),
                template_content: JSON.stringify(templateContent.json),
                action: 'sip_save_template_content'
            },
            success: function(response) {
                if (response.success) {
                    alert('Template saved successfully.');
                    $('#template-editor-modal').hide();
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function(xhr, status, error) {
                alert('AJAX Error: ' + error);
            }
        });
    });

    $('#template-editor-cancel, #template-editor-close').on('click', function() {
        $('#template-editor-modal').hide();
    });

     // Handle dragging functionality (original version)
     var isDragging = false;
     var offsetX, offsetY;
 
     // Handle dragging functionality
     $(document).ready(function($) {
        var isDragging = false;
        var offsetX, offsetY;
        
        $('#template-editor-header').on('mousedown', function(e) {
            e.preventDefault();
            isDragging = true;
            var modal = $('#template-editor-content');
            offsetX = e.clientX - modal.offset().left;
            offsetY = e.clientY - modal.offset().top;
            
            $(document).on('mousemove.dragModal', function(e) {
                if (isDragging) {
                    var left = e.clientX - offsetX;
                    var top = e.clientY - offsetY;
                    modal.css({
                        top: top + 'px',
                        left: left + 'px',
                        position: 'fixed', // Ensures it's fixed to the viewport
                        margin: 0
                    });
                }
            }).on('mouseup.dragModal', function() {
                isDragging = false;
                $(document).off('mousemove.dragModal mouseup.dragModal');
            });
        });
    });
    // Handle render html toggle
    $(document).ready(function($) {
        $('#toggle-view').on('change', function() {
            if ($(this).is(':checked')) {
                // Switch to HTML output view
                $('#html-editor-view').hide();
                var htmlContent = editorDescription.codemirror.getValue();
                $('#html-rendered-output').html(htmlContent);
                $('#html-output-view').show();
            } else {
                // Switch to HTML code view
                $('#html-output-view').hide();
                $('#html-editor-view').show();
            }
        });
    });
 });




///////////////////////////////////////////IMAGE UPLOAD FUNCTIONALITY////////////////////////////////////////


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
