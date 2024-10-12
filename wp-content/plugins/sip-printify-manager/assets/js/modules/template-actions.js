var sip = sip || {};

sip.templateActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
        // Register the success handler here
        ajax.registerSuccessHandler('template_action', handleSuccessResponse);
    }

    function attachEventListeners() {
        $(document).on('click', '.rename-template', handleInlineRenaming);
        $('#template-action-form').off('submit').on('submit', handleTemplateActionFormSubmit);
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
    
        handleTemplateAction(formData, action);
    }

    function handleTemplateAction(formData, action) {
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
        console.log('Entering handleSuccessResponse in template-actions.js');
        console.log('Response:', response);

        if (response.data.template_list_html) {
            console.log('Updating template list');
            $('#template-table-list').html(response.data.template_list_html).show();
        }
        if (response.data.template_data && response.data.template_action === 'create_new_products') {
            console.log('Calling initializeCreationTable');
            initializeCreationTable(response.data.template_data);
        } else {
            console.log('Not calling initializeCreationTable. template_action:', response.data.template_action);
        }
        $('input[name="selected_templates[]"], #select-all-templates').prop('checked', false);

        console.log('Exiting handleSuccessResponse in template-actions.js');
    }

    function initializeCreationTable(templateData) {
        console.log('Initializing creation table with data:', templateData);
        
        const table = $('#creation-table');
        const thead = table.find('thead');
        const tbody = table.find('tbody');

        // Clear existing content
        thead.empty();
        tbody.empty();

        // Build table headers
        const headers = ['#', 'Design - Front', 'Title', 'Description', 'Tags', 'Colors', 'Sizes', 'Price'];
        let headerRow = '<tr>';
        headers.forEach(function(header, index) {
            headerRow += `<th>${escapeHtml(header)}${index === 0 ? '<input type="checkbox" id="select-all-rows">' : ''}</th>`;
        });
        headerRow += '</tr>';
        thead.append(headerRow);

        console.log('Header row appended');

        // Build main template row
        let mainRow = '<tr class="main-template-row">';
        mainRow += '<td><input type="checkbox" disabled></td>'; // Checkbox for #
        mainRow += buildDesignCell(templateData);
        mainRow += `<td class="editable" data-key="title">${escapeHtml(templateData.title)}</td>`;
        mainRow += `<td class="editable" data-key="description">${escapeHtml(truncateText(templateData.description, 30))}<button class="edit-button" title="Edit">&#9998;</button></td>`;
        mainRow += `<td class="editable" data-key="tags">${escapeHtml(templateData.tags.join(', '))}</td>`;
        mainRow += `<td>${getColorsSwatches(templateData['options - colors'])}</td>`;
        mainRow += `<td>${getSizesString(templateData['options - sizes'])}</td>`;
        mainRow += `<td>${getPriceRange(templateData.variants)}</td>`;
        mainRow += '</tr>';
        tbody.append(mainRow);

        console.log('Main row appended');

        // Show the creation table container
        $('#product-creation-container').show();

        console.log('Creation actions initialized');
    }

    function buildDesignCell(templateData) {
        // Implement this function based on your specific requirements
        return '<td class="design-cell">Design Placeholder</td>';
    }

    function getColorsSwatches(colors) {
        return colors.map(color => 
            `<span class="color-swatch" title="${escapeHtml(color.title)}" style="background-color: ${escapeHtml(color.colors[0])}"></span>`
        ).join('');
    }

    function getSizesString(sizes) {
        const desiredSizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
        return sizes.sort((a, b) => desiredSizeOrder.indexOf(a.title) - desiredSizeOrder.indexOf(b.title))
                    .map(size => escapeHtml(size.title))
                    .join(', ');
    }

    function getPriceRange(variants) {
        if (variants && variants.length > 0) {
            const prices = variants.map(variant => variant.price);
            const minPrice = Math.min(...prices) / 100;
            const maxPrice = Math.max(...prices) / 100;
            return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
        }
        return 'N/A';
    }

    function escapeHtml(string) {
        const entityMap = {
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;', '/': '&#x2F;'
        };
        return String(string).replace(/[&<>"'\/]/g, s => entityMap[s]);
    }

    function truncateText(text, maxLength) {
        const strippedText = text.replace(/<[^>]+>/g, '');
        return strippedText.length > maxLength ? strippedText.substring(0, maxLength) + '...' : strippedText;
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);

console.log('Template actions module loaded, success handler registered');