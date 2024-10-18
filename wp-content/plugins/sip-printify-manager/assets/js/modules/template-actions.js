var sip = sip || {};

sip.templateActions = (function($, ajax, utilities) {
    var isDirty = false;
    var isTemplateLoaded = false;

    function init() {
        attachEventListeners();
        // if (!isTemplateLoaded && sip.creationActions && typeof sip.creationActions.checkForLoadedTemplate === 'function') {
        //     sip.creationActions.checkForLoadedTemplate();
        // }
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
        console.log('***hidespinner called after success response in template-actions.js');
        utilities.hideSpinner();
    }

    function populateCreationTable(templateData) {
        // console.log('Populating creation table with data:', templateData);
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
    
    function processTemplateData(templateData) {
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
    
        // Helper function to compare two image arrays
        const areImageArraysEqual = (arr1, arr2) => {
            if (arr1.length !== arr2.length) return false;
            return arr1.every((img, index) => img.id === arr2[index].id);
        };
    
        // Process each print area
        templateData.print_areas.forEach((printArea) => {
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
    
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    function buildTableContent(table, templateData) {
        console.log('Entering buildTableContent function');
        
        const thead = table.find('thead');
        const tbody = table.find('tbody');
    
        // Clear existing content
        thead.empty();
        tbody.empty();
    
        try {
            // Build table headers
            const headers = buildHeaders(templateData);
            thead.append(headers);
    
            // Process template data to get unique variants
            const uniqueVariants = processTemplateData(templateData);
    
            // Build rows
            const rows = buildTableRows(uniqueVariants, templateData);
          
            tbody.append(rows);
            
            // Call helper functions with error handling
            if (typeof updateVariantHeaderCounts === 'function') updateVariantHeaderCounts();
            if (typeof collectVariantColors === 'function') collectVariantColors();
            if (typeof hideVariantRowsInitially === 'function') hideVariantRowsInitially();
            if (typeof collectVariantSizes === 'function') collectVariantSizes(templateData);
            if (typeof collectVariantPrices === 'function') collectVariantPrices();
        } catch (error) {
            console.error('Error in buildTableContent:', error.message);
            // You might want to display this error to the user or handle it in some other way
        }
        
        console.log('Exiting buildTableContent function');
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
        headerRow += '<th rowspan="2" data-column="number">#</th>';
        headerRow += '<th rowspan="2" data-column="title">Title</th>';
        headerRow += `<th colspan="${maxImages}" data-column="print-area">${printAreaPosition.charAt(0).toUpperCase() + printAreaPosition.slice(1)} - Design</th>`;
        headerRow += '<th rowspan="2" data-column="state">State</th>';
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

    function getMaxImagesCount(templateData) {
        return Math.max(...templateData.print_areas.map(area => 
            area.placeholders[0].images.length
        ));
    }


    function areImageArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((img, index) => img.id === arr2[index].id);
    }

    function buildTableRows(uniqueVariants, templateData) {
        let rows = '';
        
        // Build the main data row first
        rows += `<tr class="main-template-row">`;
        rows += `<td class="toggle-variant-rows" data-column="toggle">+</td>`;
        rows += `<td data-column="select"><input type="checkbox" class="select-template"></td>`;
        rows += `<td data-column="number">0</td>`;
        rows += `<td class="editable" data-column="title" data-key="title">${escapeHtml(templateData.title)}</td>`;
        // Add empty cells for images (will be filled by updateVariantHeaderCounts)
        for (let i = 0; i < getMaxImagesCount(templateData); i++) {
            rows += `<td class="image-cell" data-column="image" data-image-index="${i}"></td>`;
        }
        rows += `<td class="non-editable" data-column="state" data-key="state">Template</td>`;
        rows += buildColorSwatches(uniqueVariants[0].colors);
        rows += `<td class="editable" data-column="sizes" data-key="sizes">${getSizesString(templateData['options - sizes'])}</td>`;
        rows += `<td class="editable" data-column="tags" data-key="tags">${escapeHtml(truncateText(templateData.tags.join(', '), 18))}</td>`;
        rows += `<td class="editable" data-column="description" data-key="description">${escapeHtml(truncateText(templateData.description, 18))}</td>`;
        rows += `<td class="editable" data-column="price" data-key="prices">${getPriceRange(templateData.variants)}</td>`;
        rows += '</tr>';
    
        // Initialize an array to keep track of unique images in each column
        let uniqueImagesInColumns = new Array(getMaxImagesCount(templateData)).fill().map(() => new Set());
    
        // Now include all variants
        uniqueVariants.forEach((variant, index) => {
            rows += `<tr class="variant-row">`;
            rows += `<td></td>`; // Empty cell for toggle
            rows += `<td><input type="checkbox" class="select-variant"></td>`;
            rows += `<td>0${String.fromCharCode(97 + index)}</td>`; // a, b, c, ...
            rows += `<td>${escapeHtml(templateData.title)} - Variant ${String.fromCharCode(65 + index)}</td>`; // A, B, C, ...
            rows += buildVariantImageCells(variant.images, uniqueImagesInColumns);
            rows += `<td class="non-editable" data-key="state">Template - Variant</td>`;
            rows += buildColorSwatches(variant.colors);
            rows += `<td>${getSizesString(templateData['options - sizes'])}</td>`;
            rows += '<td></td>'; // Tags (empty for variants)
            rows += '<td></td>'; // Description (empty for variants)
            const variantPrices = variant.variantIds
                .map(id => templateData.variants.find(v => v.id === id))
                .filter(v => v && v.price !== undefined)
                .map(v => v.price);
            rows += `<td>${getPriceRange(variantPrices)}</td>`;
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

    function buildVariantImageCells(variantImages, uniqueImagesInColumns) {
        let cells = '';
        for (let i = 0; i < variantImages.length; i++) {
            cells += '<td class="image-cell">';
            if (variantImages[i] && !uniqueImagesInColumns[i].has(variantImages[i].id)) {
                cells += `<div class="image-container">`;
                cells += `<input type="checkbox" class="image-select" data-image-id="${escapeHtml(variantImages[i].id)}">`;
                cells += `<div class="image-content">`;
    
                if (variantImages[i].src) {
                    cells += `<img src="${escapeHtml(variantImages[i].src)}" alt="${escapeHtml(variantImages[i].name)}" width="30" height="30" data-full-src="${escapeHtml(variantImages[i].src)}" class="clickable-thumbnail">`;
                } else if (variantImages[i].type && variantImages[i].type.includes('svg')) {
                    cells += `<div class="image-placeholder">.svg</div>`;
                } else {
                    cells += `<div class="image-placeholder">${variantImages[i].type || 'No image'}</div>`;
                }
    
                let imageNameWithoutExtension = variantImages[i].name.replace(/\.[^/.]+$/, '');
                cells += `<span class="image-name" data-tooltip="${escapeHtml(variantImages[i].name)}">${escapeHtml(imageNameWithoutExtension)}</span>`;
                cells += `</div></div>`;
    
                // Add this image to the set of unique images for this column
                uniqueImagesInColumns[i].add(variantImages[i].id);
            } else {
                cells += '-';
            }
            cells += '</td>';
        }
        return cells;
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

    // Existing helper functions
    function getMaxImagesCount(templateData) {
        return Math.max(...templateData.print_areas.map(area => 
            area.placeholders[0].images.length
        ));
    }

    function getSizesString(sizes) {
        const desiredSizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
        return sizes.sort((a, b) => desiredSizeOrder.indexOf(a.title) - desiredSizeOrder.indexOf(b.title))
                    .map(size => escapeHtml(size.title))
                    .join(', ');
    }

    function collectVariantSizes(templateData) {
        console.log('Entering collectVariantSizes function');
        
        const mainTemplateRowSizes = document.querySelector('.main-template-row [data-column="sizes"]');
        
        if (!mainTemplateRowSizes) {
            console.error('Main template row sizes data not found.');
            return;
        }
        
        const allSizes = mainTemplateRowSizes.textContent.trim();
        console.log('All sizes:', allSizes);
    
        // Update variant rows with their specific sizes
        const variantRows = document.querySelectorAll('.variant-row');
        variantRows.forEach((row, index) => {
            const sizeCell = row.querySelector('[data-column="sizes"]');
            if (sizeCell) {
                sizeCell.textContent = allSizes;
            } else {
                console.error(`Size cell not found for variant row ${index}`);
            }
        });
    
        console.log('Exiting collectVariantSizes function');
    }

    function getPriceRange(variants) {
        if (!Array.isArray(variants) || variants.length === 0) {
            return 'N/A';
        }
    
        const prices = variants
            .filter(variant => variant && typeof variant.price === 'number')
            .map(variant => variant.price);
    
        if (prices.length === 0) {
            return 'N/A';
        }
    
        const minPrice = Math.min(...prices) / 100;
        const maxPrice = Math.max(...prices) / 100;
        return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
    }
    
    function collectVariantPrices() {
        console.log('Entering collectVariantPrices function');
    
        const mainTemplateRowPrice = document.querySelector('.main-template-row [data-column="price"]');
        
        if (!mainTemplateRowPrice) {
            console.error('Main template row price data not found.');
            return;
        }
        
        console.log('Main template row price:', mainTemplateRowPrice.textContent);
    
        // Extract the low and high price from the main template row price text
        const priceMatch = mainTemplateRowPrice.textContent.match(/\$(\d+\.\d{2})\s*-\s*\$(\d+\.\d{2})/);
        if (!priceMatch) {
            console.error('Invalid price format in main template row');
            return;
        }
    
        let [, lowPrice, highPrice] = priceMatch.map(price => parseFloat(price));
    
        console.log(`Price range: $${lowPrice.toFixed(2)} - $${highPrice.toFixed(2)}`);
    
        // We don't need to iterate through variant rows for prices, as they all show N/A
    
        console.log('Exiting collectVariantPrices function');
    }
    
    // Update the buildTableContent function to pass templateData to collectVariantPrices
    function buildTableContent(table, templateData) {
        console.log('Entering buildTableContent function');
        
        // ... (previous code remains the same)
    
        try {
            if (typeof updateVariantHeaderCounts === 'function') updateVariantHeaderCounts();
            if (typeof collectVariantColors === 'function') collectVariantColors();
            if (typeof hideVariantRowsInitially === 'function') hideVariantRowsInitially();
            if (typeof collectVariantSizes === 'function') collectVariantSizes(templateData);
            if (typeof collectVariantPrices === 'function') collectVariantPrices(templateData);
        } catch (error) {
            console.error('Error in helper functions:', error);
        }
        
        console.log('Exiting buildTableContent function');
    }
    
    function buildTableContent(table, templateData) {
        console.log('Entering buildTableContent function');
        
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
        
        // Call helper functions with error handling
        try {
            if (typeof updateVariantHeaderCounts === 'function') updateVariantHeaderCounts();
            if (typeof collectVariantColors === 'function') collectVariantColors();
            if (typeof hideVariantRowsInitially === 'function') hideVariantRowsInitially();
            if (typeof collectVariantSizes === 'function') collectVariantSizes(templateData);
            if (typeof collectVariantPrices === 'function') collectVariantPrices();
        } catch (error) {
            console.error('Error in helper functions:', error);
        }
        
        console.log('Exiting buildTableContent function');
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

    function updateVariantHeaderCounts() {
        const mainRow = document.querySelector('.main-template-row');
        const variantRows = document.querySelectorAll('.variant-row');
        const imageCells = mainRow.querySelectorAll('td.image-cell');
    
        imageCells.forEach((cell, index) => {
            const variantCells = Array.from(variantRows).map(row => row.querySelectorAll('td.image-cell')[index]);
            const nonEmptyVariantCells = variantCells.filter(cell => cell.querySelector('img'));
    
            if (nonEmptyVariantCells.length === 1) {
                const variantCell = nonEmptyVariantCells[0];
                const img = variantCell.querySelector('img');
                const title = variantCell.querySelector('.image-name')?.textContent || '';
                cell.innerHTML = `
                    <img src="${img.src}" alt="${title}" width="30" height="30">
                    <br>
                    <span class="image-name">${title}</span>
                `;
            } else if (nonEmptyVariantCells.length > 1) {
                cell.textContent = `${nonEmptyVariantCells.length} variants`;
            } else {
                cell.textContent = 'No variants';
            }
        });
    }
    
    function updateOtherSummaryColumns() {
        // Update other summary columns (sizes, tags, description, etc.) if needed
        // This function can be implemented based on your specific requirements
    }
    
    // This function ensures that variant rows are collapsed on page load
    function hideVariantRowsInitially() {
        $('.variant-row').hide();  // Hide variant rows initially
        $('.toggle-variant-rows').text('+');  // Set the initial state of the toggle to collapsed
        console.log('Variant rows in Product Creation Table collapsed');
    }

    // Add this new function to handle the toggle functionality
    function attachToggleEventListener() {
        $('.toggle-variant-rows').on('click', function() {
            const $this = $(this);
            const $variantRows = $this.closest('tr').nextAll('.variant-row');
            
            if ($this.text() === '+') {
                $variantRows.show();
                $this.text('-');
            } else {
                $variantRows.hide();
                $this.text('+');
            }
        });
    }

    return {
        init: init,
        attachToggleEventListeners: attachToggleEventListener,
        handleSuccessResponse: handleSuccessResponse,
        populateCreationTable: populateCreationTable
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('template_action', sip.templateActions.handleSuccessResponse);