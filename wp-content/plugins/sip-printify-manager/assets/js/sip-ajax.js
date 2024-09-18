jQuery(document).ready(function($) {
    var originalContent = '';

    // Function to handle AJAX requests for token and other actions
    function handleAjaxAction(actionType, formData = null, buttonSelector = null, spinnerSelector = null) {
        if (buttonSelector) {
            $(buttonSelector).attr('disabled', true); // Disable button to prevent multiple clicks
        }
        if (spinnerSelector) {
            $(spinnerSelector).show(); // Show spinner
        }

        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (buttonSelector) {
                    $(buttonSelector).attr('disabled', false); // Re-enable button
                }
                if (spinnerSelector) {
                    $(spinnerSelector).hide(); // Hide spinner
                }

                if (response.success) {
                    switch (actionType) {
                        case 'save_token':
                        case 'reauthorize':
                        case 'new_token':
                            alert(response.data);
                            location.reload(); // Reload page
                            break;
                        case 'product_action':
                            if (response.data.product_list_html) {
                                $('#product-list').html(response.data.product_list_html);
                            }
                            if (response.data.template_list_html) {
                                $('#template-list').html(response.data.template_list_html);
                            }
                            $('input[name="selected_products[]"]').prop('checked', false); // Clear product checkboxes
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
                                    $('#template-list').html(response.data.template_list_html);
                                }
                                $('input[name="selected_templates[]"]').prop('checked', false); // Clear template checkboxes
                            }
                            break;
                        default:
                            alert('Unknown action type');
                    }
                } else {
                    alert('Error: ' + response.data);
                }
            },
            error: function() {
                if (buttonSelector) {
                    $(buttonSelector).attr('disabled', false); // Re-enable button on error
                }
                if (spinnerSelector) {
                    $(spinnerSelector).hide(); // Hide spinner on error
                }
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Handle form submissions (save token, product actions, template actions)
    $('#save-token-form, #product-action-form, #template-action-form').on('submit', function(e) {
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
                $('input[name="selected_products[]"]:checked').each(function() {
                    selectedProducts.push($(this).val());
                });
                formData.delete('selected_products[]');
                selectedProducts.forEach(function(productId) {
                    formData.append('selected_products[]', productId);
                });
                break;
            case 'template-action-form':
                actionType = 'template_action';
                var selectedTemplates = $('input[name="selected_templates[]"]:checked').map(function() {
                    return this.value;
                }).get();
                formData.delete('selected_templates[]');
                selectedTemplates.forEach(function(templateId) {
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
    $('#reauthorize-button').click(function(e) {
        e.preventDefault();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'reauthorize');
        formData.append('nonce', sipAjax.nonce);

        handleAjaxAction('reauthorize', formData, '#reauthorize-button', '#loading-spinner');
    });

    // Handle New Store Token button click
    $('#new-token-button').click(function(e) {
        e.preventDefault();

        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'new_token');
        formData.append('nonce', sipAjax.nonce);

        handleAjaxAction('new_token', formData, '#new-token-button', '#loading-spinner');
    });

    // Show/hide rename input based on selected action
    $('#template_action').on('change', function() {
        if ($(this).val() === 'rename_template') {
            $('#rename-template-input').show();
        } else {
            $('#rename-template-input').hide();
        }
    });

    // Close editor
    $('#close-editor').on('click', function() {
        $('#template-editor').hide();
    });

    // Revert changes
    $('#revert-changes').on('click', function() {
        $('#template-content').val(originalContent);
    });

    // Save template changes
    $('#save-template').on('click', function() {
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'save_template');
        formData.append('nonce', sipAjax.nonce);
        formData.append('template_name', $('#editing-template-name').text());
        formData.append('template_content', $('#template-content').val());

        handleAjaxAction('save_template', formData, '#save-template', '#loading-spinner');
    });
});
