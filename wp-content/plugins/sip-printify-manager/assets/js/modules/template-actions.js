var sip = sip || {};

sip.templateActions = (function($, ajax, utilities) {
    var isDirty = false;
    var isTemplateLoaded = false;

    function init() {
        attachEventListeners();
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
        updateVariantHeaderCounts();  // Call this after rows are appended
        collectVariantColors();
        hideVariantRowsInitially();
        collectVariantSizes();
        collectVariantPrices();
        
        // console.log('All rows appended');
    }

    function processTemplateData(templateData) {
        // console.log('Processing template data:', templateData);
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
    
        // console.log('Processed unique variants:', uniqueVariants);
        return uniqueVariants;
    }

    function areImageArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((img, index) => img.id === arr2[index].id);
    }

    function buildTableRows(uniqueVariants, templateData, baseRowNumber) {
        let rows = '';
        const firstRowImages = uniqueVariants[0].images;  // Save the images of the first row
    
        // Insert the main data row first
        uniqueVariants.forEach((variant, index) => {
            const isMainRow = index === 0;
            
            // Build the main data row
            rows += `<tr class="${isMainRow ? 'main-template-row' : 'variant-row'}">`;
            rows += `<td><input type="checkbox"></td>`;

            // Numbering logic:
            if (isMainRow) {
                rows += `<td>0</td>`;  // The main product row is always numbered "0"
            } else {
                // Variations get a letter appended to 0: 0a, 0b, 0c, etc.
                rows += `<td>0${String.fromCharCode(97 + index - 1)}</td>`;
            }

            // Handle the title:
            if (isMainRow) {
                rows += `<td class="editable" data-key="title">${escapeHtml(templateData.title)}</td>`;
                rows += buildImageCells(variant.images);
            } else {
                // Variant title uses letters: Variant A, Variant B, etc.
                rows += `<td>Variant ${String.fromCharCode(65 + index - 1)}</td>`;
                rows += buildVariantImageCells(variant.images, firstRowImages);
            }
    
            // Add state
            rows += `<td class="non-editable" data-key="state">${isMainRow ? 'Template' : ''}</td>`;
    
            // Add color swatches
            rows += buildColorSwatches(variant.colors);
    
            if (isMainRow) {
                rows += `<td class="editable" data-key="sizes">${getSizesString(templateData['options - sizes'])}</td>`;
                rows += `<td class="editable" data-key="tags">${escapeHtml(truncateText(templateData.tags.join(', '), 18))}</td>`;
                rows += `<td class="editable" data-key="description">${escapeHtml(truncateText(templateData.description, 18))}</td>`;
                rows += `<td class="editable" data-key="prices">${getPriceRange(templateData.variants)}</td>`;
            } else {
                rows += `<td>${getSizesString(templateData['options - sizes'])}</td>`;
                rows += '<td colspan="3"></td>';  // Span the remaining columns
            }
    
            rows += '</tr>';
    
            // Insert the variants header row after the main data row
            if (isMainRow) {
                rows += '<tr class="variants-header-row">';
                rows += `<td><input type="checkbox"></td>`; // Checkbox cell
                rows += `<td class="toggle-variant-rows">+</td>`; // Toggle button starts as "+"
                rows += `<td>${escapeHtml(templateData.title)} - Variants</td>`;
                // Add image header cells with unique IDs for each column
                for (let i = 1; i <= 4; i++) {
                    rows += `<td id="variant-header-image-${i}">-</td>`;
                }
                rows += `<td id="variant-header-state">-</td>`;
                rows += `<td id="variant-header-colors">-</td>`;               
                rows += `<td id="variant-header-sizes">-</td>`;
                rows += `<td id="variant-header-tags">-</td>`;
                rows += `<td id="variant-header-description">-</td>`;
                rows += `<td id="variant-header-prices">-</td>`;                
                rows += '</tr>';
            }
        });
    
        hideVariantRowsInitially();

        // Call to collect and display the colors in the header
        return rows;
    }
    
    // This function ensures that variant rows are collapsed on page load
    function hideVariantRowsInitially() {
        $('.variant-row').hide();  // Hide variant rows initially
        $('.toggle-variant-rows').text('+');  // Set the initial state of the toggle to collapsed
    }

    function buildImageCells(images) {
        let cells = '';
        for (let i = 0; i < images.length; i++) {
            cells += '<td class="image-cell">';
            if (images[i]) {
                cells += `<div class="image-container">`;
                cells += `<input type="checkbox" class="image-select" data-image-id="${escapeHtml(images[i].id)}">`;
                cells += `<div class="image-content">`;
    
                if (images[i].src) {
                    cells += `<img src="${escapeHtml(images[i].src)}" alt="${escapeHtml(images[i].name)}" width="30" height="30" data-full-src="${escapeHtml(images[i].src)}" class="clickable-thumbnail">`;
                } else if (images[i].type && images[i].type.includes('svg')) {
                    cells += `<div class="image-placeholder">.svg</div>`;
                } else {
                    cells += `<div class="image-placeholder">${images[i].type || 'No image'}</div>`;
                }
    
                // Remove the file extension from the image name for display
                let imageNameWithoutExtension = images[i].name.replace(/\.[^/.]+$/, '');
    
                // Add a title attribute with the full image name for the tooltip
                cells += `<span class="image-name" data-tooltip="${escapeHtml(images[i].name)}">${escapeHtml(imageNameWithoutExtension)}</span>`;
                cells += `</div></div>`;
            } else {
                cells += `<div class="image-placeholder"></div>`;
            }
            cells += '</td>';
        }
        return cells;
    }

    function buildVariantImageCells(variantImages, firstRowImages) {
        let cells = '';
        for (let i = 0; i < variantImages.length; i++) {
            // Check if the image is the same as in the first row
            if (variantImages[i] && firstRowImages[i] && variantImages[i].id === firstRowImages[i].id) {
                // Leave the cell blank if the image matches
                cells += '<td class="image-cell"><input type="checkbox" class="image-select"></td>';
            } else {
                // Otherwise, build the image cell with the image content
                cells += '<td class="image-cell">';
                if (variantImages[i]) {
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
    
                    // Remove the file extension from the image name for display
                    let imageNameWithoutExtension = variantImages[i].name.replace(/\.[^/.]+$/, '');
    
                    // Add a title attribute with the full image name for the tooltip
                    cells += `<span class="image-name" data-tooltip="${escapeHtml(variantImages[i].name)}">${escapeHtml(imageNameWithoutExtension)}</span>`;
                    cells += `</div></div>`;
                } else {
                    cells += `<div class="image-placeholder"></div>`;
                }
                cells += '</td>';
            }
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
            headerRow += `<th data-image-index="${i - 1}">image #${i}</th>`;
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

    function collectVariantSizes() {
        // Select the main template row's sizes cell using the data-key
        const mainTemplateRowSizes = document.querySelector('.main-template-row [data-key="sizes"]');
        
        if (!mainTemplateRowSizes) {
            console.error('Main template row sizes data not found.');
            return;
        }
        
        // Create an array of the sizes from the main template
        const mainSizes = mainTemplateRowSizes.textContent.split(',').map(size => size.trim());

        // Initialize an array to store any variant sizes that don't match the main template
        let variantSizesDiff = [];

        // Iterate through all variant rows to check if any sizes are different
        const variantRows = document.querySelectorAll('.variant-row [data-key="sizes"]');
        variantRows.forEach(variantRowSizes => {
            const variantSizes = variantRowSizes.textContent.split(',').map(size => size.trim());

            // Find sizes that are in the variant but not in the main template
            const differentSizes = variantSizes.filter(size => !mainSizes.includes(size));
            
            // Add any different sizes to the diff array
            if (differentSizes.length > 0) {
                variantSizesDiff = variantSizesDiff.concat(differentSizes);
            }
        });

        // Update the header cell with different sizes or set to "-" if there are none
        const sizesHeaderCell = document.getElementById('variant-header-sizes');
        if (variantSizesDiff.length > 0) {
            sizesHeaderCell.textContent = variantSizesDiff.join(', ');
        } else {
            sizesHeaderCell.textContent = '-';
        }
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

    function collectVariantPrices() {
        // Select the main template row's price cell using the data-key
        const mainTemplateRowPrice = document.querySelector('.main-template-row [data-key="prices"]');
        
        if (!mainTemplateRowPrice) {
            console.error('Main template row price data not found.');
            return;
        }
        
        // Extract the low and high price from the main template row price text (assuming format "lowPrice - highPrice")
        let [mainLowPrice, mainHighPrice] = mainTemplateRowPrice.textContent.split('-').map(price => parseFloat(price.trim().replace('$', '')));
        
        // Initialize the new price range
        let newLowPrice = mainLowPrice;
        let newHighPrice = mainHighPrice;
    
        // Iterate through all variant rows to find if any price is outside the template range
        const variantRows = document.querySelectorAll('.variant-row [data-key="prices"]');
        variantRows.forEach(variantRowPrice => {
            const [variantLowPrice, variantHighPrice] = variantRowPrice.textContent.split('-').map(price => parseFloat(price.trim().replace('$', '')));
            
            // Check if any variant price is lower or higher than the current template range
            if (variantLowPrice < newLowPrice) {
                newLowPrice = variantLowPrice;
            }
            if (variantHighPrice > newHighPrice) {
                newHighPrice = variantHighPrice;
            }
        });
    
        // Update the header only if the price range has changed
        const priceHeaderCell = document.getElementById('variant-header-prices');
        if (newLowPrice !== mainLowPrice || newHighPrice !== mainHighPrice) {
            priceHeaderCell.textContent = `$${newLowPrice.toFixed(2)} - $${newHighPrice.toFixed(2)}`;
        } else {
            priceHeaderCell.textContent = '-';
        }
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
        // Initialize counters
        let imageColumnCounts = [];
        let tagCount = 0;
        let descriptionCount = 0;

        // Find how many image columns there are dynamically (assuming all variant rows have the same number of image cells)
        const imageColumnCount = $('.variant-row:first').find('td.image-cell').length;

        // Initialize the image counters based on the number of image columns
        for (let i = 0; i < imageColumnCount; i++) {
            imageColumnCounts[i] = 0;
        }
    
        // Iterate over all variant rows
        $('.variant-row').each(function() {
            // Count image columns with content
            $(this).find('td.image-cell').each(function(index) {
                if ($(this).find('img').length > 0) {
                    imageColumnCounts[index]++;
                }
            });
    
            // Count if the tag cell has content
            if ($(this).find('td[data-key="tags"]').text().trim() !== '') {
                tagCount++;
            }
    
            // Count if the description cell has content
            if ($(this).find('td[data-key="description"]').text().trim() !== '') {
                descriptionCount++;
            }
        });
    
        // Update the header row with the counts or '-'
        for (let i = 0; i < imageColumnCount; i++) {
            if (imageColumnCounts[i] > 0) {
                $(`#variant-header-image-${i + 1}`).text(imageColumnCounts[i]);
            } else {
                $(`#variant-header-image-${i + 1}`).text('-');
            }
        }
    
        // Update tag and description counts
        if (tagCount > 0) {
            $('#variant-header-tags').text(tagCount);
        } else {
            $('#variant-header-tags').text('-');
        }
    
        if (descriptionCount > 0) {
            $('#variant-header-description').text(descriptionCount);
        } else {
            $('#variant-header-description').text('-');
        }
    }
    
    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
        populateCreationTable: populateCreationTable
    };

})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('template_action', sip.templateActions.handleSuccessResponse);