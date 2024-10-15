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

//////////////////////////////////////////////////////////////////////////////////////////////////////
    function buildTableContent(table, templateData) {
        const thead = table.find('thead');
        const tbody = table.find('tbody');

        // Clear existing content
        thead.empty();
        tbody.empty();

        // Build table headers
        const headers = buildHeaders(templateData);
        thead.append(headers);

        // Process template data to get unique variants
        const uniqueVariants = processTemplateData(templateData);

        // Build rows
        const rows = buildTableRows(uniqueVariants, templateData);
        tbody.append(rows);

        console.log('All rows appended');
    }

    function processTemplateData(templateData) {
        console.log('Processing template data:', templateData);
        const uniqueVariants = [];
        let colorOptions = templateData['options - colors'] || [];
    
        if (!templateData.print_areas || !Array.isArray(templateData.print_areas)) {
            console.error('print_areas not found or not an array in template data');
            return uniqueVariants;
        }
    
        // Helper function to find existing variant with the same image array
        const findExistingVariant = (images) => {
            return uniqueVariants.find(v => areImageArraysEqual(v.images, images));
        };
    
        // Process each print area
        templateData.print_areas.forEach((printArea, index) => {
            const images = printArea.placeholders[0].images;
            let existingVariant = findExistingVariant(images);
    
            if (existingVariant) {
                // Combine variant_ids if image array already exists
                existingVariant.variantIds = [...new Set([...existingVariant.variantIds, ...printArea.variant_ids])];
            } else {
                // Create new variant if image array is unique
                existingVariant = {
                    id: uniqueVariants.length,
                    variantIds: printArea.variant_ids,
                    images: images,
                    colors: []
                };
                uniqueVariants.push(existingVariant);
            }
    
            // Process colors for the variant
            printArea.variant_ids.forEach(variantId => {
                if (templateData.variants && Array.isArray(templateData.variants)) {
                    const variantData = templateData.variants.find(v => v.id === variantId);
                    if (variantData && variantData.options && variantData.options.length > 0) {
                        const colorId = variantData.options[0];
                        const color = colorOptions.find(c => c.id === colorId);
                        if (color && !existingVariant.colors.some(c => c.id === color.id)) {
                            existingVariant.colors.push(color);
                        }
                    }
                }
            });
        });
    
        console.log('Processed unique variants:', uniqueVariants);
        return uniqueVariants;
    }

    function areImageArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((img, index) => img.id === arr2[index].id);
    }


    function buildTableRows(uniqueVariants, templateData) {
        let rows = '';
        uniqueVariants.forEach((variant, index) => {
            const isMainRow = index === 0;
    
            rows += `<tr class="${isMainRow ? 'main-template-row' : 'variant-row'}">`;
            rows += `<td><input type="checkbox"></td>`;
            rows += `<td>${index + 1}</td>`;
    
            if (isMainRow) {
                rows += `<td class="editable" data-key="title">${escapeHtml(templateData.title)}</td>`;
            } else {
                rows += `<td>Variant ${index.toString().padStart(2, '0')}</td>`;
            }
    
            // Add image cells
            rows += buildImageCells(variant.images);
    
            // Add state
            rows += `<td class="non-editable">${isMainRow ? 'Template' : ''}</td>`;
    
            // Add color swatches
            rows += buildColorSwatches(variant.colors);
    
            if (isMainRow) {
                rows += `<td>${getSizesString(templateData['options - sizes'])}</td>`;
                rows += `<td class="editable" data-key="tags">${escapeHtml(templateData.tags.join(', '))}</td>`;
                rows += `<td class="editable" data-key="description">${escapeHtml(truncateText(templateData.description, 30))}<button class="edit-button" title="Edit">&#9998;</button></td>`;
                rows += `<td>${getPriceRange(templateData.variants)}</td>`;
            } else {
                rows += `<td>${getSizesString(templateData['options - sizes'])}</td>`;
                rows += '<td colspan="3"></td>'; // Span the remaining columns
            }
    
            rows += '</tr>';
        });
    
        return rows;
    }

    function buildImageCells(images) {
        let cells = '';
        for (let i = 0; i < 4; i++) {
            cells += '<td class="image-cell">';
            if (images[i]) {
                cells += buildImageContent(images[i]);
            }
            cells += '</td>';
        }
        return cells;
    }

    function buildImageContent(image) {
        return `
            <div class="image-container">
                <input type="checkbox" class="image-select" data-image-id="${escapeHtml(image.id)}">
                <div class="image-content">
                    <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.name)}" width="30" height="30" data-full-src="${escapeHtml(image.src)}" class="clickable-thumbnail">
                    <span class="image-name">${escapeHtml(image.name)}</span>
                </div>
            </div>
        `;
    }

    function buildColorSwatches(colors) {
        let swatches = `<td class="color-swatches">`;
        colors.forEach(color => {
            swatches += `
                <span class="color-swatch" title="${escapeHtml(color.title)}" 
                      style="background-color: ${escapeHtml(color.colors[0])}"></span>
            `;
        });
        swatches += '</td>';
        return swatches;
    }

    // Existing helper functions
    function getMaxImagesCount(templateData) {
        return Math.max(...templateData.print_areas.map(area => 
            area.placeholders.reduce((max, placeholder) => 
                Math.max(max, placeholder.images.length), 0)
        ));
    }

    function buildHeaders(templateData) {
        const maxImages = getMaxImagesCount(templateData);
        let headerRow = '<tr>';
        headerRow += '<th rowspan="2"><input type="checkbox" id="select-all-rows"></th>';
        headerRow += '<th rowspan="2">#</th>';
        headerRow += '<th rowspan="2">Title</th>';
        headerRow += `<th colspan="${maxImages}">Front - Design</th>`;
        headerRow += '<th rowspan="2">State</th>';
        headerRow += '<th rowspan="2">Colors</th>';
        headerRow += '<th rowspan="2">Sizes</th>';
        headerRow += '<th rowspan="2">Tags</th>';
        headerRow += '<th rowspan="2">Description</th>';
        headerRow += '<th rowspan="2">Price</th>';
        headerRow += '</tr>';

        // Subheader for image numbers
        headerRow += '<tr>';
        for (let i = 1; i <= maxImages; i++) {
            headerRow += `<th>image #${i}</th>`;
        }
        headerRow += '</tr>';

        return headerRow;
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