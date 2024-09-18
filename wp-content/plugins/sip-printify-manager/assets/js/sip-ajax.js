jQuery(document).ready(function ($) {
    var originalContent = '';

    // Function to handle AJAX requests for token and other actions
    function handleAjaxAction(actionType, formData = null, buttonSelector = null, spinnerSelector = null) {
        if (buttonSelector) {
            $(buttonSelector).attr('disabled', true); // Disable button to prevent multiple clicks
        }
        if (spinnerSelector) {
            $(spinnerSelector).show(); // Show spinner overlay
            $('#spinner-overlay').show(); // Show the global spinner overlay
        }

        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (buttonSelector) {
                    $(buttonSelector).attr('disabled', false); // Re-enable button
                }
                if (spinnerSelector) {
                    $(spinnerSelector).hide(); // Hide spinner
                }

                if (response.success) {
                    switch (actionType) {
                        case 'save_token':
                            location.reload(); // Reload to show the shop page
                            break;

                        case 'new_token':
                            // Start the spinner overlay before making any changes
                            $('#spinner-overlay').show();
                        
                            // Use AJAX to send the request to delete the token
                            $.ajax({
                                url: sipAjax.ajax_url,  // WordPress AJAX URL
                                type: 'POST',
                                data: {
                                    action: 'sip_handle_ajax_request', // Your action name
                                    action_type: 'new_token',          // This will trigger the token deletion
                                    nonce: sipAjax.nonce               // Include the nonce for security
                                },
                                success: function(response) {
                                    if (response.success) {
                                        // Reload the page to show the auth page
                                        location.reload();  // Page reload will clear the spinner automatically
                                    } else {
                                        alert('Failed to reset the token. Please try again.');
                                    }
                                },
                                error: function() {
                                    alert('An error occurred. Please try again.');
                                }
                            });
                        
                            // No need to stop the spinner here as the page will reload and the spinner will be cleared automatically
                            break;
                            
                            

                            // First hide all shop elements
//                            $('#product-list').hide();
//                            $('#template-list').hide();
//                            $('#reauthorize-button').hide();
//                            $('#new-token-button').hide();
                        
                            // Hide spinner only after ensuring all DOM updates are complete
//                            setTimeout(function() {
                                // Now show the auth token form
 //                               $('#save-token-form').show();
 //                               $('#printify_bearer_token').val(''); // Clear token field
 //                               $('#spinner-overlay').hide(); // Finally, hide the spinner overlay
//                            }, 500);  // Giving enough time to ensure DOM updates before hiding spinner
                        
                            break;                                                        

                        case 'product_action':
                            if (response.data.product_list_html) {
                                $('#product-list').html(response.data.product_list_html).show();
                            }
                            if (response.data.template_list_html) {
                                $('#template-list').html(response.data.template_list_html).show();
                            }
                            $('input[name="selected_products[]"]').prop('checked', false);
                            $('#spinner-overlay').hide(); // Hide spinner overlay after update
                            break;

                        case 'template_action':
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
                                if (response.data.template_list_html) {
                                    $('#template-list').html(response.data.template_list_html).show();
                                }
                                $('input[name="selected_templates[]"]').prop('checked', false);
                            }
                            $('#spinner-overlay').hide(); // Hide spinner overlay after update
                            break;

                        default:
                            alert('Unknown action type');
                            $('#spinner-overlay').hide(); // Hide spinner overlay on error
                    }
                } else {
                    alert('Error: ' + response.data);
                    $('#spinner-overlay').hide(); // Hide spinner overlay on error
                }
            },
            error: function () {
                if (buttonSelector) {
                    $(buttonSelector).attr('disabled', false); // Re-enable button on error
                }
                if (spinnerSelector) {
                    $(spinnerSelector).hide(); // Hide spinner on error
                }
                $('#spinner-overlay').hide(); // Hide global spinner overlay on error
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Handle form submissions
    $('#save-token-form, #product-action-form, #template-action-form').on('submit', function (e) {
        e.preventDefault();

        var formData = new FormData(this);
        var actionType = '';

        switch ($(this).attr('id')) {
            case 'save-token-form':
                actionType = 'save_token';
                break;
            case 'product-action-form':
                actionType = 'product_action';
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
                var selectedTemplates = $('input[name="selected_templates[]"]:checked').map(function () {
                    return this.value;
                }).get();
                formData.delete('selected_templates[]');
                selectedTemplates.forEach(function (templateId) {
                    formData.append('selected_templates[]', templateId);
                });
                break;
        }

        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', actionType);
        formData.append('nonce', sipAjax.nonce);

        handleAjaxAction(actionType, formData, null, '#loading-spinner'); // Call reusable function
    });

    // Handle Re-authorize button click
    $('#reauthorize-button').click(function (e) {
        e.preventDefault();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'reauthorize');
        formData.append('nonce', sipAjax.nonce);

        handleAjaxAction('reauthorize', formData, '#reauthorize-button', '#loading-spinner');
    });

    // Handle New Store Token button click
    $('#new-token-button').click(function (e) {
        e.preventDefault();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'new_token');
        formData.append('nonce', sipAjax.nonce);

        handleAjaxAction('new_token', formData, '#new-token-button', '#loading-spinner');
    });

    // Show/hide rename input based on selected action
    $('#template_action').on('change', function () {
        if ($(this).val() === 'rename_template') {
            $('#rename-template-input').show();
        } else {
            $('#rename-template-input').hide();
        }
    });

    // Close editor
    $('#close-editor').on('click', function () {
        $('#template-editor').hide();
    });

    // Revert changes
    $('#revert-changes').on('click', function () {
        $('#template-content').val(originalContent);
    });

    // Save template changes
    $('#save-template').on('click', function () {
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'save_template');
        formData.append('nonce', sipAjax.nonce);
        formData.append('template_name', $('#editing-template-name').text());
        formData.append('template_content', $('#template-content').val());

        handleAjaxAction('save_template', formData, '#save-template', '#loading-spinner');
    });
});
