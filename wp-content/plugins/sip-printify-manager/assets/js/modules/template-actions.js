var sip = sip || {};

sip.templateActions = (function($, ajax, utilities) {
    var isDirty = false;
    var isTemplateLoaded = false;

    function init() {
        attachEventListeners();
        ajax.registerSuccessHandler('template_action', handleSuccessResponse);
        if (!isTemplateLoaded && sip.creationActions && typeof sip.creationActions.checkForLoadedTemplate === 'function') {
            sip.creationActions.checkForLoadedTemplate();
        }
    }

    function attachEventListeners() {
        $('#template-action-form').off('submit').on('submit', handleTemplateActionFormSubmit);
    }

    function handleTemplateActionFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        var formData = new FormData(this);
        var action = $('#template_action').val();
        console.log('Template action triggered:', action);
    
        if (action === 'create_new_products') {
            var selectedTemplates = $('input[name="selected_templates[]"]:checked');
            if (selectedTemplates.length === 0) {
                utilities.showToast('Please select a template before executing an action', 3000);
                return;
            }
        }
    
        if (action === 'create_new_products' && isDirty) {
            if (!confirm('Loading a new template will discard unsaved changes. Continue?')) {
                return;
            }
        }
    
        utilities.showSpinner(); // Show spinner after validation
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
    
        if (response.data && response.data.template_list_html) {
            $('#template-table-list').html(response.data.template_list_html).show();
        }
        if (response.data && response.data.template_data) {
            console.log('Template data received:', response.data.template_data);
            initializeCreationTable(response.data.template_data);
        } else {
            console.log('No template data in response');
        }
    
        $('input[name="selected_templates[]"], #select-all-templates').prop('checked', false);
        utilities.hideSpinner();
    }

    function populateCreationTable(templateData) {
        console.log('Populating creation table with data:', templateData);
        initializeCreationTable(templateData);
    }

    // function waitForTableToPopulate(table) {
    //     return new Promise((resolve) => {
    //         console.log('Starting to observe table population');
    //         const observer = new MutationObserver((mutations) => {
    //             if (table.find('tbody tr').length > 0) {
    //                 console.log('Table population observed');
    //                 observer.disconnect();
    //                 resolve();
    //             }
    //         });
    
    //         observer.observe(table[0], {
    //             childList: true,
    //             subtree: true
    //         });
    
    //         // Failsafe: resolve after 5 seconds if table doesn't populate
    //         setTimeout(() => {
    //             console.log('Failsafe timeout reached for table population');
    //             observer.disconnect();
    //             resolve();
    //         }, 5000);
    //     });
    // }

    function initializeCreationTable(templateData) {
        if (!templateData) {
            console.log('No template data to initialize');

            return;
        }
        
        console.log('Initializing creation table with data:', templateData);

        const table = $('#creation-table');
        const thead = table.find('thead');
        const tbody = table.find('tbody');
    
        // Clear existing content
        thead.empty();
        tbody.empty();
    
        // Set the selected template name
        $('#selected-template-name').text(templateData.title);
    
        // Build and append table content
        buildTableContent(table, templateData);
    
        // Show the creation table container
        $('#product-creation-container').show();
        $('#no-template-message').hide();
        $('#creation-table').show();

        // // Wait for the table to be fully populated before hiding the spinner
        // waitForTableToPopulate(table).then(() => {
        //     console.log('Table fully populated, about to hide spinner');
        //     utilities.hideSpinner();
        //     console.log('Spinner hidden after table fully populated');
        // });
        saveLoadedTemplate(templateData);
    }

    function saveLoadedTemplate(templateData) {
        console.log('Saving loaded template:', templateData);
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'set_loaded_template');
        formData.append('template_data', JSON.stringify(templateData));
        formData.append('nonce', sipAjax.nonce);
        sip.ajax.handleAjaxAction('creation_action', formData);
    }

    function buildTableContent(table, templateData) {
        const thead = table.find('thead');
        const tbody = table.find('tbody');

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
        handleSuccessResponse: handleSuccessResponse,
        populateCreationTable: populateCreationTable
    };
})(jQuery, sip.ajax, sip.utilities);