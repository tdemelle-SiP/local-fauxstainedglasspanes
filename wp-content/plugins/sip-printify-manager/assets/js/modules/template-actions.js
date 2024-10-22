var sip = sip || {};

sip.templateActions = (function($, ajax, utilities) {
    var isDirty = false;
    var isTemplateLoaded = false;

    function init() {
        attachEventListeners();
        
        // Restore highlight from localStorage on page load
        const savedTemplate = localStorage.getItem('lastSelectedTemplate');
        if (savedTemplate) {
            window.lastSelectedTemplate = savedTemplate;
            const templateRow = $(`tr[data-template-id="${savedTemplate}"]`);
            if (templateRow.length) {
                templateRow.addClass('wip');
            }
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
        console.log('*****ShowSpinner called on handleTemplateFormSubmit in template-actions.js');
        handleTemplateAction(formData, action);
    }

    function handleTemplateAction(formData, action) {
        if (action === 'create_new_products') {
            const selectedId = $('input[name="selected_templates[]"]:checked').val();
            console.log('Selected template ID:', selectedId);
            window.lastSelectedTemplate = selectedId;
            // Mirror to localStorage
            localStorage.setItem('lastSelectedTemplate', selectedId);
        }

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
        console.log('Template response:', response);
        
        if (response.data && response.data.template_list_html) {
            $('#template-table-list').html(response.data.template_list_html).show();
        }
        
        // After any template-related success response
        if (window.lastSelectedTemplate) {
            console.log('Restoring highlight for template:', window.lastSelectedTemplate);
            const templateRow = $(`tr[data-template-id="${window.lastSelectedTemplate}"]`);
            if (templateRow.length) {
                $('#template-table-content tr').removeClass('wip'); // Clear any existing highlights
                templateRow.addClass('wip');
                console.log('Template highlighted');
            }
        }
        
        if (response.data && response.data.template_data) {
            console.log('template-actions.js handlesuccessresponse - initializecreationtable');
            initializeCreationTable(response.data.template_data);
            
            if (sip.imageActions && typeof sip.imageActions.updateImageRowHighlights === 'function') {
                sip.imageActions.updateImageRowHighlights(response.data.template_data);
            }
        }
    
        $('input[name="selected_templates[]"], #select-all-templates').prop('checked', false);
        utilities.hideSpinner();
    }
    
    function populateCreationTable(templateData) {
        console.log('template-actions.js populateCreationTable function', templateData);
        initializeCreationTable(templateData);
    }

    function initializeCreationTable(templateData) {
        // console.log('initializeCreationTable triggered');
        // console.log('Is initStickyHeader available?', typeof sip.utilities.initStickyHeader);
    
        if (!templateData) {
            console.log('No template data to initialize');
            return;
        }
        
        // console.log('Initializing creation table with data:', templateData);

        const table = $('#creation-table');
        const thead = table.find('thead');
        const tbody = table.find('tbody');
    
        // Clear existing content
        thead.empty();
        tbody.empty();
    
        // Set the selected template name
        $('#selected-template-subtitle').text(templateData.title);
    
        // Build and append table content
        buildTableContent(table, templateData);
    
        // Call the sticky header initialization
        sip.utilities.initStickyHeader("#creation-title-header", 32); // Adjust the offset as needed
        sip.utilities.initStickyHeader("#creation-table-container thead", 93); // Adjust the offset as needed
        // Initialize tooltips for the image names
        sip.utilities.initTooltip('.image-name', 1000);

        // Show the creation table container
        $('#product-creation-container').show();
        $('#no-template-message').hide();
        $('#creation-table').show();

        saveLoadedTemplate(templateData);
    }

    function saveLoadedTemplate(templateData) {
        // console.log('Saving loaded template:', templateData);
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'set_loaded_template');
        formData.append('template_data', JSON.stringify(templateData));
        formData.append('nonce', sipAjax.nonce);
        sip.ajax.handleAjaxAction('creation_action', formData);
    }
    ///////////////////////////PROCESS TEMPLATE DATA//////////////////////////////////////
    function processTemplateData(templateData) {
        const uniqueVariants = [];
        const colorOptions = templateData['options - colors'] || [];
        const sizeOptions = templateData['options - sizes'] || [];
    
        const findExistingVariant = (images) => {
            return uniqueVariants.find(v => 
                v.images.length === images.length && 
                v.images.every((img, index) => img.id === images[index].id)
            );
        };
    
        if (!templateData.print_areas || !Array.isArray(templateData.print_areas)) {
            console.error('print_areas not found or not an array in template data');
            return uniqueVariants;
        }
    
        templateData.print_areas.forEach((printArea) => {
            const images = printArea.placeholders[0].images;
            let existingVariant = findExistingVariant(images);
    
            if (existingVariant) {
                existingVariant.variantIds = [...new Set([...existingVariant.variantIds, ...printArea.variant_ids])];
            } else {
                existingVariant = {
                    id: uniqueVariants.length,
                    variantIds: printArea.variant_ids,
                    images: images,
                    colors: [],
                    sizes: [],
                    prices: []
                };
                uniqueVariants.push(existingVariant);
            }
    
            printArea.variant_ids.forEach(variantId => {
                const variantData = templateData.variants.find(v => v.id === variantId);
                if (variantData && variantData.options && variantData.options.length >= 2) {
                    variantData.options.forEach(optionId => {
                        const colorOption = colorOptions.find(c => c.id === optionId);
                        if (colorOption && !existingVariant.colors.some(c => c.id === colorOption.id)) {
                            existingVariant.colors.push(colorOption);
                        }
    
                        const sizeOption = sizeOptions.find(s => s.id === optionId);
                        if (sizeOption && !existingVariant.sizes.some(s => s.id === sizeOption.id)) {
                            existingVariant.sizes.push(sizeOption);
                        }
                    });
    
                    if (typeof variantData.price === 'number' && !existingVariant.prices.includes(variantData.price)) {
                        existingVariant.prices.push(variantData.price);
                    }
                }
            });
    
            existingVariant.sizes.sort((a, b) => sizeOptions.indexOf(a) - sizeOptions.indexOf(b));
            existingVariant.prices.sort((a, b) => a - b);
        });
    
        return uniqueVariants;
    }
    
    function buildHeaders(templateData) {
        if (!templateData.print_areas || templateData.print_areas.length === 0) {
            throw new Error('Template data is missing print areas information.');
        }

        const firstPrintArea = templateData.print_areas[0];
        if (!firstPrintArea.placeholders || firstPrintArea.placeholders.length === 0) {
            throw new Error('Print area is missing placeholder information.');
        }

        const firstPlaceholder = firstPrintArea.placeholders[0];
        if (!firstPlaceholder.position) {
            throw new Error('Print area position is not specified in the template data.');
        }

        const printAreaPosition = firstPlaceholder.position;
        const maxImages = getMaxImagesCount(templateData);

        let headerRow = '<tr>';
        headerRow += '<th class="toggle-variant-header" rowspan="2" data-column="toggle"></th>';
        headerRow += '<th rowspan="2" data-column="select"><input type="checkbox" id="select-all-rows"></th>';
        headerRow += '<th rowspan="2" data-column="type">Row Type</th>';
        headerRow += '<th rowspan="2" data-column="number">#</th>';
        headerRow += '<th rowspan="2" data-column="title">Title</th>';
        headerRow += `<th colspan="${maxImages}" data-column="print-area">${printAreaPosition.charAt(0).toUpperCase() + printAreaPosition.slice(1)} - Design</th>`;
        headerRow += '<th rowspan="2" data-column="colors">Colors</th>';
        headerRow += '<th rowspan="2" data-column="sizes">Sizes</th>';
        headerRow += '<th rowspan="2" data-column="tags">Tags</th>';
        headerRow += '<th rowspan="2" data-column="description">Description</th>';
        headerRow += '<th rowspan="2" data-column="price">Price</th>';
        headerRow += '</tr>';

        // Subheader for image numbers
        headerRow += '<tr>';
        for (let i = 1; i <= maxImages; i++) {
            headerRow += `<th data-column="image" data-image-index="${i - 1}">image #${i}</th>`;
        }
        headerRow += '</tr>';

        return headerRow;
    }

    ///////////////////////BUILD TABLE ROWS///////////////////////////
    function buildTableRows(uniqueVariants, templateData) {
        let rows = '';
    
        // Calculate the overall price range and sizes for all variants
        const allPrices = uniqueVariants.flatMap(v => v.prices);
        const allSizes = uniqueVariants.flatMap(v => v.sizes.map(s => s.title));
        const mainPriceRange = getPriceRange(allPrices);
        const mainSizes = getSizesString(allSizes);
    
        // Collect all unique colors
        const uniqueColors = [...new Set(uniqueVariants.flatMap(v => v.colors.map(c => JSON.stringify(c))))].map(c => JSON.parse(c));
    
        // Build the main data row
        rows += `<tr class="main-template-row">`;
        rows += `<td class="toggle-variant-rows" data-column="toggle">+</td>`;
        rows += `<td data-column="select"><input type="checkbox" class="select-template"></td>`;
        rows += `<td class="non-editable" data-column="type" data-key="type">Template</td>`;
        rows += `<td data-column="number">0</td>`;
        rows += `<td class="editable" data-column="title" data-key="title">${escapeHtml(templateData.title)}</td>`;
        // Add empty cells for images (will be filled by updateVariantHeaderCounts)
        for (let i = 0; i < getMaxImagesCount(templateData); i++) {
            rows += `<td class="image-cell" data-column="image" data-image-index="${i}"></td>`;
        }
        rows += buildSummaryColorSwatches(uniqueColors);
        rows += `<td class="editable" data-column="sizes" data-key="sizes">${mainSizes}</td>`;
        rows += `<td class="editable" data-column="tags" data-key="tags">${escapeHtml(truncateText(templateData.tags.join(', '), 18))}</td>`;
        rows += `<td class="editable" data-column="description" data-key="description">${escapeHtml(truncateText(templateData.description, 18))}</td>`;
        rows += `<td class="editable" data-column="price" data-key="prices">${mainPriceRange}</td>`;
        rows += '</tr>';
    
        // Initialize an array to keep track of unique images in each column
        let uniqueImagesInColumns = new Array(getMaxImagesCount(templateData)).fill().map(() => new Set());

        // Now include all variants
        uniqueVariants.forEach((variant, index) => {
            rows += `<tr class="variant-row">`;
            rows += `<td data-column="toggle"></td>`; // Empty cell for toggle
            rows += `<td data-column="select"><input type="checkbox" class="select-variant"></td>`;
            rows += `<td class="non-editable" data-column="type" data-key="type">Template - Variant</td>`;
            rows += `<td data-column="number">0${String.fromCharCode(97 + index)}</td>`; // a, b, c, ...
            rows += `<td data-column="title">${escapeHtml(templateData.title)} - Variant ${String.fromCharCode(65 + index)}</td>`; // A, B, C, ...
            rows += buildVariantImageCells(variant.images, uniqueImagesInColumns);
            rows += buildColorSwatches(variant.colors);
            
            // Sizes - always display the full range
            const variantSizes = getSizesString(variant.sizes.map(s => s.title));
            rows += `<td data-column="sizes">${variantSizes}</td>`;

            rows += '<td data-column="tags"></td>'; // Tags (empty for variants)
            rows += '<td data-column="description"></td>'; // Description (empty for variants)

            // Prices - always display the full range
            const variantPriceRange = getPriceRange(variant.prices);
            rows += `<td data-column="price">${variantPriceRange}</td>`;

            rows += '</tr>';

            // Update uniqueImagesInColumns with this variant's images
            variant.images.forEach((image, imageIndex) => {
                if (image) {
                    uniqueImagesInColumns[imageIndex].add(image.id);
                }
            });
        });

        return rows;
    }

    ///////////////////////////BUILD TABLE CONTENT////////////////////////////////////////////
    function buildTableContent(table, templateData) {
        console.log('Building table content');
        
        const thead = table.find('thead');
        const tbody = table.find('tbody');
    
        thead.empty();
        tbody.empty();
    
        try {
            const headers = buildHeaders(templateData);
            thead.append(headers);
    
            const uniqueVariants = processTemplateData(templateData);
            const rows = buildTableRows(uniqueVariants, templateData);
            tbody.append(rows);
            
            // Just call hideVariantRowsInitially - no need to rebind event
            hideVariantRowsInitially();
            
            if (typeof updateVariantHeaderCounts === 'function') updateVariantHeaderCounts();
            if (typeof collectVariantColors === 'function') collectVariantColors();
            if (typeof collectVariantSizes === 'function') collectVariantSizes(templateData);
            if (typeof collectVariantPrices === 'function') collectVariantPrices();
        } catch (error) {
            console.error('Error in buildTableContent:', error.message);
        }
    }

    function updateVariantHeaderCounts() {
        const mainRow = document.querySelector('.main-template-row');
        const variantRows = document.querySelectorAll('.variant-row');
        const imageCells = mainRow.querySelectorAll('td.image-cell');
    
        imageCells.forEach((cell, index) => {
            const variantCells = Array.from(variantRows).map(row => row.querySelectorAll('td.image-cell')[index]);
            const nonEmptyVariantCells = variantCells.filter(cell => 
                cell.querySelector('img') || cell.querySelector('.svg-text-thumbnail') || cell.querySelector('.image-placeholder')
            );
    
            console.log(`Cell ${index}: ${nonEmptyVariantCells.length} non-empty variants`);
    
            if (nonEmptyVariantCells.length === 1) {
                const variantCell = nonEmptyVariantCells[0];
                const img = variantCell.querySelector('img');
                const svgText = variantCell.querySelector('.svg-text-thumbnail');
                const placeholder = variantCell.querySelector('.image-placeholder');
                const title = variantCell.querySelector('.image-name')?.textContent || '';
    
                if (img) {
                    cell.innerHTML = `
                        <img src="${img.src}" alt="${title}" width="30" height="30">
                        <br>
                        <span class="image-name">${title}</span>
                    `;
                } else if (svgText) {
                    cell.innerHTML = `
                        <div class="svg-text-thumbnail" style="${svgText.style.cssText}">
                            ${svgText.textContent}
                        </div>
                        <br>
                        <span class="image-name">${title}</span>
                    `;
                } else if (placeholder) {
                    cell.innerHTML = placeholder.outerHTML + `<br><span class="image-name">${title}</span>`;
                }
            } else if (nonEmptyVariantCells.length > 1) {
                cell.textContent = `${nonEmptyVariantCells.length} variants`;
            } else {
                cell.innerHTML = 'No variants<br><span class="debug-info">Debug: Check console</span>';
                console.log(`No variants for cell ${index}. Variant cells:`, variantCells);
            }
        });
    }
    

    function hideVariantRowsInitially() {
        $('.variant-row').hide();
        $('.toggle-variant-rows').text('+');
        console.log('Variant rows initially hidden');
    }

    //////////////////////////////IMAGES/////////////////////////////////
    function getMaxImagesCount(templateData) {
        return Math.max(...templateData.print_areas.map(area => 
            area.placeholders[0].images.length
        ));
    }

    function buildVariantImageCells(variantImages, uniqueImagesInColumns) {
        console.log('Building variant image cells:', variantImages);
        let cells = '';
        for (let i = 0; i < variantImages.length; i++) {
            cells += '<td class="image-cell">';
            if (variantImages[i] && !uniqueImagesInColumns[i].has(variantImages[i].id)) {
                console.log(`Processing image ${i}:`, variantImages[i]);
                cells += `<div class="image-container">`;
                cells += `<input type="checkbox" class="image-select" data-image-id="${escapeHtml(variantImages[i].id)}">`;
                cells += `<div class="image-content" title="${escapeHtml(variantImages[i].name || variantImages[i].input_text || '')}">`;

    
                if (variantImages[i].src) {
                    cells += `<img src="${escapeHtml(variantImages[i].src)}" alt="${escapeHtml(variantImages[i].name)}" width="30" height="30" data-full-src="${escapeHtml(variantImages[i].src)}" class="clickable-thumbnail">`;
                } else if (variantImages[i].type && variantImages[i].type.includes('svg')) {
                    console.log('Creating SVG text thumbnail');
                    const svgText = variantImages[i].input_text || '';
                    const fontFamily = variantImages[i].font_family || 'sans-serif';
                    const fontColor = variantImages[i].font_color || '#000000';
                    const fontSize = Math.min(parseInt(variantImages[i].font_size) || 11, 13);
                    const fontWeight = variantImages[i].font_weight || 'normal';
                    const backgroundColor = variantImages[i].background_color || 'transparent';
                    
                    cells += `
                        <div class="svg-text-thumbnail" 
                             style="font-family: ${fontFamily}; color: ${fontColor}; font-size: ${fontSize}px; font-weight: ${fontWeight}; background-color: ${backgroundColor};"
                             title="${escapeHtml(svgText)}">
                            ${escapeHtml(svgText)}
                        </div>`;
                } else {
                    cells += `<div class="image-placeholder">${variantImages[i].type || 'No image'}</div>`;
                }
    
                let imageNameWithoutExtension = variantImages[i].name ? variantImages[i].name.replace(/\.[^/.]+$/, '') : (variantImages[i].input_text || 'Unnamed');
                cells += `<span class="image-name" data-tooltip="${escapeHtml(variantImages[i].name || variantImages[i].input_text || '')}">${escapeHtml(imageNameWithoutExtension)}</span>`;
                cells += `</div></div>`;
    
                uniqueImagesInColumns[i].add(variantImages[i].id);
            } else {
                console.log(`Skipping image ${i}:`, variantImages[i]);
                // cells += `<div class="debug-info">Debug: ${JSON.stringify(variantImages[i])}</div>`;
            }
            cells += '</td>';
        }
        return cells;
    }

    ////////////////////////////COLORS/////////////////////////////////////
    function buildSummaryColorSwatches(colors) {
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

    function collectVariantColors() {
        let allColors = new Set(); // Using a Set to prevent duplicates
    
        // Find all variant rows and collect the color swatches
        $('.variant-row').each(function() {
            // Look for color swatches within this row
            $(this).find('.color-swatches .color-swatch').each(function() {
                const colorStyle = $(this).attr('style');
                const colorTitle = $(this).attr('title');
    
                // Ensure both colorStyle and colorTitle are available
                if (colorStyle && colorTitle) {
                    // Add the color swatch HTML to the Set (avoid duplicates)
                    allColors.add(`<span class="color-swatch" title="${escapeHtml(colorTitle)}" style="${escapeHtml(colorStyle)}"></span>`);
                }
            });
        });
    
        // Convert the Set to an array and join them to create the final HTML
        const colorHeaderContent = Array.from(allColors).join('');
    
        // Update the header with the collected colors
        $('#variant-header-colors').html(colorHeaderContent);
    
        // console.log("Color header updated with: ", colorHeaderContent); // Debugging output
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
    //////////////////////////////SIZES//////////////////////////////////////
    function collectVariantSizes() {
        console.log('Entering collectVariantSizes function');
        
        const mainTemplateRowSizes = document.querySelector('.main-template-row [data-column="sizes"]');
        
        if (!mainTemplateRowSizes) {
            console.error('Main template row sizes data not found.');
            return;
        }
        
        const mainSizes = mainTemplateRowSizes.textContent.trim();
        console.log('Main sizes:', mainSizes);
    
        // Update variant rows with their specific sizes only if they differ from the main sizes
        const variantRows = document.querySelectorAll('.variant-row');
        variantRows.forEach((row, index) => {
            const sizeCell = row.querySelector('[data-column="sizes"]');
            if (sizeCell) {
                const variantSizes = sizeCell.textContent.trim();
                if (variantSizes === '') {
                    sizeCell.textContent = '-';
                }
            } else {
                console.error(`Size cell not found for variant row ${index}`);
            }
        });
    
        console.log('Exiting collectVariantSizes function');
    }

    function getSizesString(sizes) {
        const desiredSizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
        return [...new Set(sizes)]
            .sort((a, b) => desiredSizeOrder.indexOf(a) - desiredSizeOrder.indexOf(b))
            .join(', ');
    }

    //////////////////////////////PRICES//////////////////////////////////////
    function collectVariantPrices() {
        console.log('Entering collectVariantPrices function');
    
        const mainTemplateRowPrice = document.querySelector('.main-template-row [data-column="price"]');
        
        if (!mainTemplateRowPrice) {
            console.error('Main template row price data not found.');
            return;
        }
        
        const mainPriceRange = mainTemplateRowPrice.textContent.trim();
        console.log('Main price range:', mainPriceRange);
    
        // Update variant rows with their specific price ranges only if they differ from the main price range
        const variantRows = document.querySelectorAll('.variant-row');
        variantRows.forEach((row, index) => {
            const priceCell = row.querySelector('[data-column="price"]');
            if (priceCell) {
                const variantPriceRange = priceCell.textContent.trim();
                if (variantPriceRange === '' || variantPriceRange === mainPriceRange) {
                    priceCell.textContent = '-';
                }
            } else {
                console.error(`Price cell not found for variant row ${index}`);
            }
        });
    
        console.log('Exiting collectVariantPrices function');
    }

    function getPriceRange(prices) {
        if (!Array.isArray(prices) || prices.length === 0) {
            return 'N/A';
        }
    
        const validPrices = prices.filter(price => typeof price === 'number');
    
        if (validPrices.length === 0) {
            return 'N/A';
        }
    
        const minPrice = Math.min(...validPrices) / 100;
        const maxPrice = Math.max(...validPrices) / 100;
        
        if (minPrice === maxPrice) {
            return `$${minPrice.toFixed(2)}`;
        }
        
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }

    //////////////////////////////UTILITY FUNCTIONS//////////////////////////////////////
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

sip.ajax.registerSuccessHandler('template_action', sip.templateActions.handleSuccessResponse);