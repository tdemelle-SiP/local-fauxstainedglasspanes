// assets/js/sip-ajax.js

jQuery(document).ready(function ($) {
    // Store the original content of the template editor for reverting changes
    var originalContent = '';

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
        // Disable the button to prevent multiple clicks
        if (buttonSelector) {
            $(buttonSelector).attr('disabled', true);
        }
        // Show the spinner overlay
        if (spinnerSelector) {
            $(spinnerSelector).show();
            $('#spinner-overlay').show();
        }

        // Send the AJAX request
        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false, // Don't process the files
            contentType: false, // Let jQuery set the content type
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
                if (response.success) {
                    switch (actionType) {
                        case 'save_token':
                            // Reload the page to show the shop page
                            location.reload();
                            break;

                        case 'new_token':
                            // Start the spinner overlay before making any changes
                            $('#spinner-overlay').show();

                            // Use AJAX to send the request to delete the token
                            $.ajax({
                                url: sipAjax.ajax_url,
                                type: 'POST',
                                data: {
                                    action: 'sip_handle_ajax_request',
                                    action_type: 'new_token',
                                    nonce: sipAjax.nonce
                                },
                                success: function (response) {
                                    if (response.success) {
                                        // Reload the page to show the auth page
                                        location.reload();
                                    } else {
                                        alert('Failed to reset the token. Please try again.');
                                    }
                                },
                                error: function () {
                                    alert('An error occurred. Please try again.');
                                }
                            });

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
                            }
                            $('#spinner-overlay').hide(); // Hide spinner overlay after update
                            break;

                        case 'save_template':
                            // Template saved successfully
                            alert('Template saved successfully.');
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
                            alert('Unknown action type');
                            $('#spinner-overlay').hide(); // Hide spinner overlay on error
                    }
                } else {
                    // Handle errors
                    alert('Error: ' + response.data);
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
                alert('An error occurred. Please try again.');
            }
        });
    }

    /**
     * Handle form submissions for various actions.
     * Forms handled: save token, product actions, template actions, image actions.
     */
    $('#save-token-form, #product-action-form, #template-action-form, #image-action-form').on('submit', function (e) {
        e.preventDefault(); // Prevent default form submission

        var formData = new FormData(this);
        var actionType = '';

        // Determine the action type based on the form ID
        switch ($(this).attr('id')) {
            case 'save-token-form':
                actionType = 'save_token';
                break;
            case 'product-action-form':
                actionType = 'product_action';
                // Collect selected products
                var selectedProducts = [];
                $('input[name="selected_products[]"]:checked').each(function () {
                    selectedProducts.push($(this).val());
                });
                formData.delete('selected_products[]');
                selectedProducts.forEach(function (productId) {
                    formData.append('selected_products[]', productId);
                });
                break;
            case 'template-action-form':
                actionType = 'template_action';
                // Collect selected templates
                var selectedTemplates = $('input[name="selected_templates[]"]:checked').map(function () {
                    return this.value;
                }).get();
                formData.delete('selected_templates[]');
                selectedTemplates.forEach(function (templateId) {
                    formData.append('selected_templates[]', templateId);
                });
                break;
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
        }

        // Add common data to formData
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', actionType);
        formData.append('nonce', sipAjax.nonce);

        // Call the reusable function to handle the AJAX request
        handleAjaxAction(actionType, formData, null, '#loading-spinner');
    });

    /**
     * Handle New Store Token button click.
     * Sends an AJAX request to reset the token and reloads the page.
     */
    $('#new-token-button').click(function (e) {
        e.preventDefault();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'new_token');
        formData.append('nonce', sipAjax.nonce);

        handleAjaxAction('new_token', formData, '#new-token-button', '#loading-spinner');
    });

    /**
     * Show or hide the rename template input based on the selected action.
     */
    $('#template_action').on('change', function () {
        if ($(this).val() === 'rename_template') {
            $('#rename-template-input').show();
        } else {
            $('#rename-template-input').hide();
        }
    });

    /**
     * Close the template editor when the close button is clicked.
     */
    $('#close-editor').on('click', function () {
        $('#template-editor').hide();
    });

    /**
     * Revert changes in the template editor to the original content.
     */
    $('#revert-changes').on('click', function () {
        $('#template-content').val(originalContent);
    });

    /**
     * Save the changes made to a template.
     * Sends an AJAX request to save the template content.
     */
    $('#save-template').on('click', function () {
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'save_template');
        formData.append('nonce', sipAjax.nonce);
        formData.append('template_name', $('#editing-template-name').text());
        formData.append('template_content', $('#template-content').val());

        handleAjaxAction('save_template', formData, '#save-template', '#loading-spinner');
    });

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
    $('#select-images-button').off('click').on('click', function (e) {
        e.preventDefault();
        $('#image-file-input').trigger('click');
    });

    /**
     * Handle file selection from the file input.
     * Processes the selected files.
     */
    $('#image-file-input').off('change').on('change', function (e) {
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

    // Additional event handlers for image actions can be added here if needed

});
