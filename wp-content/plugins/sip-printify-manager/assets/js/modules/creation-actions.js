// creation-actions.js

var sip = sip || {};

sip.creationActions = (function($, ajax, utilities) {
    let selectedTemplateId = null;
    let isDirty = false; // Flag to track unsaved changes

    /**
     * Initialize event listeners and setup
     */
    function init() {
        console.log('Initializing product creation...');

        // Check if a template is already selected in localStorage
        const storedTemplate = localStorage.getItem('sip_selected_template');
        if (storedTemplate) {
            selectedTemplateId = storedTemplate;
            loadProductCreationTable(selectedTemplateId);
        }

        attachEventListeners();
    }

    /**
     * Attach all event listeners
     */
    function attachEventListeners() {
        $('#create-product-button').on('click', handleCreateProduct);
        $('#product-creation-container').on('click', '#edit-json', handleEditJson);
        $('#product-creation-container').on('click', '#save-template', handleSaveTemplate);
        $('#product-creation-container').on('click', '#close-template', handleCloseTemplate);
        $('#creation-table').on('change', 'input, textarea, select', function() {
            isDirty = true;
        });
        $('#template-action-form').on('submit', function(e) {
            e.preventDefault();
            var templateAction = $('#template_action').val();
            if (templateAction === 'create_new_products') {
                var selectedTemplate = $('input[name="selected_templates[]"]:checked').first().val();
                handleCreateNewProducts(selectedTemplate);
            }
        });
    }

    function handleCreateNewProducts(selectedTemplateId) {
        console.log('create_new_products action detected...');
        if (!selectedTemplateId) {
            console.error('No template selected');
            return;
        }
        console.log('Selected template ID:', selectedTemplateId);
        localStorage.setItem('sip_selected_template', selectedTemplateId);
        loadProductCreationTable(selectedTemplateId);
    }

    /**
     * Load the Product Creation Table
     */
    function loadProductCreationTable(templateName) {
        console.log('Loading Product Creation Table for template:', templateName);
    
        $('#product-creation-container').show();
        $('#selected-template-name').text(templateName);
    
        utilities.showSpinner();
    
        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'create_new_products');
        formData.append('template_name', templateName);
        formData.append('nonce', sipAjax.nonce);
    
        sip.ajax.handleAjaxAction('creation_action', formData);
    }
    
    // Add this function to handle the AJAX response
    function handleCreationActionResponse(response) {
        console.log('AJAX response received:', response);
        utilities.hideSpinner();
    
        if (response.success) {
            console.log('Calling buildCreationTable with data:', response.data);
            buildCreationTable(response.data);
        } else {
            console.error('Error in AJAX response:', response.data);
        }
    }
    

    /**
     * Handle Create Product button click
     */
    function handleCreateProduct() {
        console.log('Create Product button clicked...');

        const formData = new FormData();
        formData.append('action', 'sip_create_product');
        formData.append('template_name', selectedTemplateId);
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('create_product', formData, 
            function(response) {
                console.log('Create product response:', response);
                if (response.success) {
                } else {
                }
            },
            function(error) {
                console.error('Error in Create Product AJAX call:', error);
            }
        );
    }

    /**
     * Handle Edit JSON button click
     */
    function handleEditJson() {
        if (!selectedTemplateId) {
            return;
        }
        $('.edit-template-content').trigger('click');
    }

    /**
     * Handle Save Template button click
     */
    function handleSaveTemplate() {
        if (!selectedTemplateId) {
            return;
        }

        const productData = collectProductData();
        const formData = new FormData();
        formData.append('action', 'sip_save_template');
        formData.append('template_name', selectedTemplateId);
        formData.append('product_data', JSON.stringify(productData));
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('save_template', formData, 
            function(response) {
                if (response.success) {
                    isDirty = false;
                } else {
                }
            },
            function(error) {
                console.error('Error saving template:', error);
            }
        );
    }

    /**
     * Handle Close Template button click
     */
    function handleCloseTemplate() {
        if (isDirty) {
            if (confirm('You have unsaved changes. Would you like to save before closing?')) {
                handleSaveTemplate();
            } else {
                resetTemplateSelection();
            }
        } else {
            resetTemplateSelection();
        }
    }

    /**
     * Reset template selection and hide the table
     */
    function resetTemplateSelection() {
        selectedTemplateId = null;
        localStorage.removeItem('sip_selected_template');
        $('#product-creation-container').hide();
        $('#creation-header').remove();
        $('#creation-table thead').empty();
        $('#creation-table tbody').empty();
    }

    /**
     * Update product data on the server
     */
    function updateProductData(key, value) {
        const updatedData = {
            key: key,
            value: value,
            template_name: selectedTemplateId
        };

        const formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'creation_action');
        formData.append('creation_action', 'update_new_product');
        formData.append('updated_data', JSON.stringify(updatedData));
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('creation_action', formData, 
            function(response) {
                if (!response.success) {
                } else {
                    isDirty = false;
                }
            },
            function(error) {
                console.error('Error updating product data:', error);
            }
        );
    }

    /**
     * Function to build the Product Creation Table with the data from the server
     *
     * @param {Object} productData - The product data received from the server.
     */
    function buildCreationTable(productData) {
        console.log('Building Product Creation Table with product data:', productData);

        const table = $('#creation-table');
        const thead = table.find('thead');
        const tbody = table.find('tbody');

        // Clear existing content
        thead.empty();
        tbody.empty();

        // Build table headers
        const headers = ['Design', 'Title', 'Sizes', 'Colors', 'Description', 'Tags'];
        console.log('Headers:', headers);

        // Determine the maximum number of images across all print areas
        let maxImages = 0;
        if (productData.print_areas && Array.isArray(productData.print_areas)) {
            productData.print_areas.forEach(function(area) {
                const images = area.placeholders && area.placeholders[0].images ? area.placeholders[0].images.length : 0;
                if (images > maxImages) {
                    maxImages = images;
                }
            });
        }

        // Add headers for additional image columns based on maxImages
        for (let i = 1; i <= maxImages; i++) {
            headers.push('Image #' + i);
        }

        console.log('Final Headers:', headers);

        let headerRow = '<tr>';
        headers.forEach(function(header) {
            headerRow += '<th>' + escapeHtml(header) + '</th>';
        });
        headerRow += '</tr>';
        thead.append(headerRow);
        console.log('Table headers added:', headers);

        // Extract color options
        const colorOptions = productData['options - colors'] ? productData['options - colors'] : [];

        // Create a mapping from color ID to color details for quick lookup
        const colorMap = createColorMap(colorOptions);
        console.log('Color Map:', colorMap);

        // Build table row with product data
        let row = '<tr>';
        row += buildDesignCell(productData, 'front');  // Front Design cell
        row += '<td class="editable" data-key="title">' + escapeHtml(productData.title) + '<button class="reset-button" title="Reset">&#8635;</button></td>';
        row += '<td>' + getSizesString(productData) + '</td>';  // Sizes data
        row += '<td>' + getColorsSwatches(productData.variant_ids, colorMap) + '</td>';  // Colors data
        row += '<td class="editable" data-key="description">' + escapeHtml(truncateText(productData.description, 30)) + '<button class="edit-button" title="Edit">&#9998;</button><button class="reset-button" title="Reset">&#8635;</button></td>';
        row += '<td class="editable" data-key="tags">' + escapeHtml(productData.tags.join(', ')) + '<button class="reset-button" title="Reset">&#8635;</button></td>';

        // Add additional image cells for each print area
        if (productData.print_areas) {
            productData.print_areas.forEach(function(area, index) {
                if (area.placeholders && area.placeholders.length > 0) {
                    const position = area.placeholders[0].position;
                    row += buildDynamicImageCells(area.placeholders[0].images, maxImages);
                }
            });
        }

        row += '</tr>';
        tbody.append(row);
        console.log('Table row added:', row);

        // Add event listeners for table actions (edit, reset)
        addEventListeners();
        console.log('Event listeners added.');

        isDirty = false; // Reset dirty flag after loading data
    }

    /**
     * Function to build design cells for each print area
     *
     * @param {Object} productData - The product data received from the server.
     * @param {string} position - The position of the print area (e.g., 'front').
     * @returns {string} - HTML string for the design cell.
     */
    function buildDesignCell(productData, position) {
        let cellContent = '<td>';
        const printArea = productData.print_areas.find(area => area.placeholders && area.placeholders[0].position === position);
        if (printArea && printArea.placeholders) {
            printArea.placeholders.forEach(function(placeholder) {
                if (placeholder.type === 'image' && placeholder.images) {
                    placeholder.images.forEach(function(image) {
                        cellContent += '<div class="image-cell" data-image-id="' + escapeHtml(image.id) + '">';
                        cellContent += '<img src="' + escapeHtml(image.src) + '" alt="' + escapeHtml(image.name) + '" class="image-thumbnail">';
                        cellContent += '<span>' + escapeHtml(image.name) + '</span>';
                        cellContent += '<button class="reset-image-button" title="Reset Image">&#8635;</button>';
                        cellContent += '</div>';
                    });
                }
            });
        }
        cellContent += '</td>';
        return cellContent;
    }

    /**
     * Function to build dynamic image cells based on the number of images
     *
     * @param {Array} images - Array of image objects.
     * @param {number} maxImages - Maximum number of images across all print areas.
     * @returns {string} - HTML string for dynamic image cells.
     */
    function buildDynamicImageCells(images, maxImages) {
        let cells = '';
        for (let i = 0; i < maxImages; i++) {
            if (i < images.length) {
                const image = images[i];
                const thumbnailSrc = image.src || 'placeholder.png'; // Ensure 'placeholder.png' exists or replace with a valid URL
                const imageName = image.name || 'Image';
                cells += `
                    <td>
                        <img src="${escapeHtml(thumbnailSrc)}" alt="${escapeHtml(imageName)}" class="image-thumbnail">
                        <div class="image-title">${escapeHtml(imageName)}</div>
                        <button class="reset-image-button" title="Reset Image">&#8635;</button>
                    </td>
                `;
            } else {
                // If fewer images, leave the cell empty
                cells += '<td></td>';
            }
        }
        return cells;
    }

    /**
     * Updated getSizesString function
     */
    function getSizesString(productData) {
        if (productData['options - sizes'] && productData['options - sizes'].length > 0) {
            const desiredSizeOrder = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
            const sizes = productData['options - sizes'].slice();
            
            sizes.sort((a, b) => {
                const indexA = desiredSizeOrder.indexOf(a.title);
                const indexB = desiredSizeOrder.indexOf(b.title);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                
                return indexA - indexB;
            });
            
            return sizes.map(size => escapeHtml(size.title)).join(', ');
        }
        return '';
    }

    /**
     * Updated getColorsSwatches function
     *
     * @param {Array} variantIds - Array of variant IDs associated with the print area.
     * @param {Object} colorMap - Mapping of color ID to color details.
     * @returns {string} - HTML string for color swatches.
     */
    function getColorsSwatches(variantIds, colorMap) {
        const uniqueColors = new Set();

        variantIds.forEach(function(id) {
            if (colorMap[id]) {
                uniqueColors.add(JSON.stringify(colorMap[id]));
            }
        });

        let swatchesHtml = '';
        uniqueColors.forEach(function(colorStr) {
            const color = JSON.parse(colorStr);
            swatchesHtml += `
                <span 
                    class="color-swatch" 
                    title="${escapeHtml(color.title)}" 
                    style="background-color: ${escapeHtml(color.hex)};"
                ></span>
            `;
        });

        return swatchesHtml;
    }

    /**
     * Creates a mapping from color ID to color details.
     *
     * @param {Array} colorOptions - Array of color option objects.
     * @returns {Object} - Mapping of color ID to { title, hex }.
     */
    function createColorMap(colorOptions) {
        const colorMap = {};
        colorOptions.forEach(function(option) {
            if (option && typeof option.id === 'number') {
                colorMap[option.id] = {
                    title: option.title,
                    hex: option.colors[0] // Assuming one hex per color
                };
            }
        });
        return colorMap;
    }

    /**
     * Function to escape HTML to prevent XSS attacks.
     *
     * @param {string} string - The string to escape.
     * @returns {string} - Escaped string.
     */
    function escapeHtml(string) {
        const entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    /**
     * Utility function to capitalize the first letter of a string.
     *
     * @param {string} string - The string to capitalize.
     * @returns {string} - Capitalized string.
     */
    function capitalizeFirstLetter(string) {
        if (typeof string !== 'string' || string.length === 0) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Function to truncate text to a specified length.
     *
     * @param {string} text - The text to truncate.
     * @param {number} maxLength - The maximum length of the text.
     * @returns {string} - Truncated text.
     */
    function truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    /**
     * Function to add event listeners to table elements
     */
    function addEventListeners() {
        // Editable cells
        $('#creation-table').on('click', 'td.editable', function() {
            const cell = $(this);
            const currentText = cell.text().trim();
            const input = $('<input type="text" class="editable-input" value="' + currentText + '">');
            cell.html(input);
            input.focus();

            input.on('blur', function() {
                const newValue = $(this).val();
                cell.text(newValue);
                cell.append(cell.find('button'));
                updateProductData(cell.data('key'), newValue);
                isDirty = true;
            });
        });

        // Reset buttons
        $('#creation-table').on('click', '.reset-button', function(e) {
            e.stopPropagation();
            const cell = $(this).closest('td');
            const key = cell.data('key');
            resetCellValue(cell, key);
        });

        // Edit buttons (for description)
        $('#creation-table').on('click', '.edit-button', function(e) {
            e.stopPropagation();
            const cell = $(this).closest('td');
            const key = cell.data('key');
            const currentText = cell.text().trim();
            openTextEditor(cell, key, currentText);
        });

        // Image reset buttons
        $('#creation-table').on('click', '.reset-image-button', function(e) {
            e.stopPropagation();
            const imageCell = $(this).closest('.image-cell');
            resetImage(imageCell);
        });

        // Close button
        $('#close-template').on('click', function() {
            resetTemplateSelection();
        });
    }

    /**
     * Function to reset cell value to template default
     */
    function resetCellValue(cell, key) {
        // For simplicity, we'll reload the table
        // In a real implementation, you might fetch only the default value for the key
        loadProductCreationTable(selectedTemplateId);
    }

    /**
     * Function to open text editor modal (for description)
     */
    function openTextEditor(cell, key, currentText) {
        // Implement a modal or overlay with a textarea
        // For simplicity, we'll use prompt
        const newText = prompt('Edit Description:', currentText);
        if (newText !== null) {
            cell.text(newText);
            cell.append(cell.find('button'));
            updateProductData(key, newText);
            isDirty = true;
        }
    }

    /**
     * Function to reset image to template default
     */
    function resetImage(imageCell) {
        // Implement logic to reset the image
        // For simplicity, we'll reload the table
        loadProductCreationTable(selectedTemplateId);
    }

    /**
     * Function to collect product data from the table
     */
    function collectProductData() {
        const table = $('#creation-table');
        const tbody = table.find('tbody tr');
        const productData = {};

        // Collect data from the table cells
        tbody.find('td').each(function(index, cell) {
            const $cell = $(cell);
            if ($cell.hasClass('editable')) {
                const key = $cell.data('key');
                const value = $cell.find('.editable-input').length > 0 ? $cell.find('.editable-input').val() : $cell.contents().filter(function() {
                    return this.nodeType === 3;
                }).text().trim();
                productData[key] = key === 'tags' ? value.split(',').map(tag => tag.trim()) : value;
            }
            // Handle other cells like Designs, Sizes, Colors if needed
        });

        // Additionally, collect designs, sizes, colors, etc., as per your data structure
        // This may require more detailed parsing based on your table structure

        return productData;
    }

    function handleSuccessResponse(response) {
        if (response.data.template_data) {
            $('#sip-section').html(response.data.template_data).show();
        }
        $('input[name="selected_templates[]"], #select-all-templates').prop('checked', false);
    }

    // Expose public methods
    return {
        init: init,
        buildCreationTable: buildCreationTable,
        handleSuccessResponse: handleSuccessResponse,
        attachEventListeners: attachEventListeners
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('creation_action', sip.creationActions.handleSuccessResponse);
