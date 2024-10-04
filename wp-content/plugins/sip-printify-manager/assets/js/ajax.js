// ajax.js

var sip = sip || {};

sip.ajaxModule = (function($) {
    function init() {
        // Event handlers and initialization code

        // Form submission handler
        $('#save-token-form, #product-action-form, #template-action-form, #creation-action-form, #image-action-form').on('submit', function (e) {
            e.preventDefault();

            // Create a new FormData object from the submitted form
            var formData = new FormData(this);
            var actionType = '';

            switch ($(this).attr('id')) {
                case 'save-token-form':
                    actionType = 'save_token';
                    break;

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

                case 'template-action-form':
                    actionType = 'template_action';
                    var templateAction = $('#template_action').val();
                    console.log('Template action triggered:', templateAction); // Log the template action for debugging

                    if (templateAction === 'create_new_products') {
                        // Log that we're bypassing the AJAX call for this case
                        console.log('Bypassing AJAX call for create_new_products. Handled in productCreation.js.');
                        return;  // This should exit early for create_new_products
                    
                    } else if (templateAction === 'delete_template') {
                        // Handle Delete Template action
                        var selectedTemplates = $('input[name="selected_templates[]"]:checked');
                        if (selectedTemplates.length === 0) {
                            alert('Please select at least one template to delete.');
                            return;
                        }
                        formData.delete('selected_templates[]');
                        selectedTemplates.forEach(function (templateId) {
                            formData.append('selected_templates[]', templateId);
                        });
                    } else {
                        // Handle other template actions
                        var selectedTemplates = [];
                        $('input[name="selected_templates[]"]:checked').each(function () {
                            selectedTemplates.push($(this).val());
                        });
                        formData.delete('selected_templates[]');
                        selectedTemplates.forEach(function (templateId) {
                            formData.append('selected_templates[]', templateId);
                        });
                    }
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

                default:
                    alert('Unknown form action.');
                    return; // Exit the function if the form ID is unrecognized
            }

            // Append common data to formData for the AJAX request
            formData.append('action', 'sip_handle_ajax_request'); // WordPress AJAX action hook
            formData.append('action_type', actionType); // Specific action to perform
            formData.append('nonce', sipAjax.nonce);

            // Call handleAjaxAction
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

        // Other event handlers...
    }

    function handleAjaxAction(actionType, formData = null, buttonSelector = null, spinnerSelector = null) {
        // When the button is clicked, it is disabled to prevent multiple clicks while the request is being processed.
        if (buttonSelector) {
            $(buttonSelector).attr('disabled', true);
        }
        // A spinner is shown to indicate that the request is being processed.
        if (spinnerSelector) {
            $(spinnerSelector).show();
            $('#spinner-overlay').show();
        }

        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false, // Don't process the files (important for file uploads)
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
                            // Handle template actions (e.g., delete, edit)
                            // Update the template list
                            if (response.data.template_list_html) {
                                $('#template-list').html(response.data.template_list_html).show();
                            }
                            $('input[name="selected_templates[]"]').prop('checked', false);
                            // Uncheck the select all checkbox
                            $('#select-all-templates').prop('checked', false);
                            $('#spinner-overlay').hide(); // Hide spinner overlay after update
                            break;

                        case 'save_template':
                            // Template saved successfully
                            $('#template-editor-overlay').hide();
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
                    alert('Error: ' + response.data);
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
                alert('AJAX Error occurred.');
            }
        });
    }

    // Expose public methods
    return {
        init: init,
        handleAjaxAction: handleAjaxAction // Expose if needed by other modules
    };
})(jQuery);
