jQuery(document).ready(function($) {
    var originalContent = '';

    $('#save-token-form, #authorization-form, #product-action-form, #template-action-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = new FormData(this);
        var actionType = '';
        if ($(this).attr('id') === 'save-token-form') {
            actionType = 'save_token';
        } else if ($(this).attr('id') === 'authorization-form') {
            actionType = $(this).find('input[type=submit]:focus').attr('name');
        } else if ($(this).attr('id') === 'product-action-form') {
            actionType = 'product_action';
            // Add selected products to formData
            var selectedProducts = [];
            $('input[name="selected_products[]"]:checked').each(function() {
                selectedProducts.push($(this).val());
            });
            formData.delete('selected_products[]'); // Remove the original selected_products
            selectedProducts.forEach(function(productId) {
                formData.append('selected_products[]', productId);
            });
        } else if ($(this).attr('id') === 'template-action-form') {
            actionType = 'template_action';
            // Add selected templates to formData
            var selectedTemplates = $('input[name="selected_templates[]"]:checked').map(function() {
                return this.value;
            }).get();
            console.log('Selected templates:', selectedTemplates); // Debugging line
            formData.delete('selected_templates[]');
            selectedTemplates.forEach(function(templateId) {
                formData.append('selected_templates[]', templateId);
            });
        }
        
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', actionType);
        formData.append('nonce', sipAjax.nonce);
        
        $('#loading-spinner').show();  // Show spinner
        
        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                $('#loading-spinner').hide();  // Hide spinner
                console.log('AJAX Response:', response);  // Log the entire response
                
                if (response.success) {
                    if (actionType === 'template_action') {
                        if (formData.get('template_action') === 'edit_template') {
                            if (response.data && response.data.template_content) {
                                $('#editing-template-name').text(response.data.template_name);
                                $('#template-content').val(response.data.template_content);
                                originalContent = response.data.template_content;
                                $('#template-editor').show();
                            } else {
                                console.error('Template content missing from response');
                                alert('Error: Template content not found');
                            }
                        } else {
                            // For delete_template and other template actions
                            if (response.data.template_list_html) {
                                console.log('Updating template list');
                                $('#template-list').html(response.data.template_list_html);
                            } else {
                                console.log('No template list HTML in response');
                            }
                        }
                    } else {
                        // Handle product actions and other non-template actions
                        if (response.data.product_list_html) {
                            console.log('Updating product list');
                            $('#product-list').html(response.data.product_list_html);
                        } else {
                            console.log('No product list HTML in response');
                        }
                        if (response.data.template_list_html) {
                            console.log('Updating template list');
                            $('#template-list').html(response.data.template_list_html);
                        } else {
                            console.log('No template list HTML in response');
                        }
                    }
                    
                    // Clear checkboxes after successful action
                    if (actionType === 'product_action' || actionType === 'template_action') {
                        $('input[type="checkbox"]').prop('checked', false);
                    }
                } else {
                    console.error('Error:', response.data);
                    alert('Error: ' + JSON.stringify(response.data));
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $('#loading-spinner').hide();
                console.error('AJAX error:', textStatus, errorThrown);
                alert('An error occurred. Please try again.');
            }
        });
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

    // Save changes
    $('#save-template').on('click', function() {
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'save_template');
        formData.append('nonce', sipAjax.nonce);
        formData.append('template_name', $('#editing-template-name').text());
        formData.append('template_content', $('#template-content').val());

        $.ajax({
            url: sipAjax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    alert('Template saved successfully!');
                    originalContent = $('#template-content').val();
                } else {
                    console.error('Error:', response.data);
                    alert('Error saving template: ' + JSON.stringify(response.data));
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('AJAX error:', textStatus, errorThrown);
                alert('An error occurred while saving the template. Please try again.');
            }
        });
    });
});