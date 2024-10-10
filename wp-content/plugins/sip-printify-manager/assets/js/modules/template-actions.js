// template-actions.js

var sip = sip || {};

sip.templateActions = (function($, ajax, utilities) {
    /**
     * Initialize template actions
     */
    function init() {
        attachInlineRenaming();
        attachTemplateActionFormSubmit();
    }

    /**
     * Attach event listener for inline template renaming
     */
    function attachInlineRenaming() {
        $(document).on('click', '.rename-template', function() {
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

                        sip.ajax.handleAjaxAction('template_action', formData, 
                            function(response) {
                                if (response.success) {
                                    $cell.text(newName).data('template-name', newName);
                                } else {
                                    $cell.text(oldName);
                                }
                            },
                            function(error) {
                                $cell.text(oldName);
                            }
                        );
                    } else {
                        $cell.text(oldName);
                    }
                }
            });
        });
    }

    /**
     * Attach event listener for template action form submission
     */
    function attachTemplateActionFormSubmit() {
        $('#template-action-form').on('submit', function (e) {
            e.preventDefault();
            var formData = new FormData(this);
            var templateAction = $('#template_action').val();
            
            console.log('Template action triggered:', templateAction);

            if (templateAction === 'create_new_products') {
                console.log('Bypassing AJAX call for create_new_products. Handled in productCreation.js.');
                return;
            } else if (templateAction === 'delete_template') {
                var selectedTemplates = $('input[name="selected_templates[]"]:checked');
                if (selectedTemplates.length === 0) {
                    return;
                }
                formData.delete('selected_templates[]');
                selectedTemplates.each(function () {
                    formData.append('selected_templates[]', $(this).val());
                });
            } else {
                formData.delete('selected_templates[]');
                $('input[name="selected_templates[]"]:checked').each(function () {
                    formData.append('selected_templates[]', $(this).val());
                });
            }

            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'template_action');
            formData.append('nonce', sipAjax.nonce);

            sip.ajax.handleAjaxAction('template_action', formData);
        });
    }

    /**
     * Handle successful response from template actions
     * @param {Object} response - The response object from the server
     */
    function handleSuccessResponse(response) {
        if (response.data.template_list_html) {
            $('#template-table-list').html(response.data.template_list_html).show();
        }
        $('input[name="selected_templates[]"], #select-all-templates').prop('checked', false);
        
    }

    // Expose public methods
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('template_action', sip.templateActions.handleSuccessResponse);

// Initialize template actions when the document is ready
jQuery(document).ready(sip.templateActions.init);