var sip = sip || {};

sip.templateActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
    }

    function attachEventListeners() {
        $(document).on('click', '.rename-template', handleInlineRenaming);
        $(document).on('submit', '.template-action-form', handleTemplateActionFormSubmit); // Change this line
    }

    function handleInlineRenaming() {
        var $cell = $(this).closest('tr').find('.template-name-cell');
        var oldName = $cell.data('template-name');
        var $input = $('<input type="text" class="rename-input" />').val(oldName);

        $cell.empty().append($input);
        $input.focus();

        $input.on('blur keyup', function(e) {
            if (e.type === 'blur' || e.keyCode === 13) {
                var newName = $input.val();

                if (newName && newName !== oldName) {
                    var formData = utilities.createFormData('template_action', 'rename_template');
                    formData.append('old_template_name', oldName);
                    formData.append('new_template_name', newName);

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
    }

    function handleTemplateActionFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling
        var $form = $(this);
        var formData = new FormData(this);
        var action = $('#template_action').val();
        console.log('Template action triggered:', action);
    
        // For other actions (like delete_template)
        $('input[name="selected_templates[]"]:checked').each(function() {
            formData.append('selected_templates[]', $(this).val());
        });
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'template_action');
        formData.append('template_action', action);
        formData.append('nonce', sipAjax.nonce);
    
        sip.ajax.handleAjaxAction('template_action', formData);
    }

    function handleSuccessResponse(response) {
        if (response.data.template_list_html) {
            $('#template-table-list').html(response.data.template_list_html).show();
        }
        $('input[name="selected_templates[]"], #select-all-templates').prop('checked', false);
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('template_action', sip.templateActions.handleSuccessResponse);