jQuery(document).ready(function($) {

    // Store the selected template ID
    let selectedTemplateId = null;

    // Event listener for the 'Apply' button in the templates section
    $('#template-actions-apply').on('click', function() {
        const action = $('#template-actions-dropdown').val();
        const selectedTemplates = $('input[name="selected_templates[]"]:checked');

        if (action === 'create_new_products') {
            if (selectedTemplates.length === 0) {
                alert('Please select at least one template.');
                return;
            }

            // For simplicity, we'll use the first selected template
            selectedTemplateId = selectedTemplates.first().val();

            // Load the Product Creation Table
            loadProductCreationTable(selectedTemplateId);
        }

        // Handle other actions...
    });

     // Function to load the Product Creation Table when a template is selected
    function loadProductCreationTable(templateName) {
        // Show the product creation container if it's hidden
        $('#product-creation-container').show();

        // Make an AJAX call to fetch the new product JSON
        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                action: 'sip_generate_new_product_json',
                template_name: templateName,
                security: sipAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Build the table with the received data
                    buildCreationTable(response.data);
                } else {
                    alert('Error: ' + response.data);
                }
            }
        });
    }

    // Function to build the Creation Table
    function buildCreationTable(productData) {
        const table = $('#creation-table');
        const thead = table.find('thead');
        const tbody = table.find('tbody');
    
        // Clear existing content
        thead.empty();
        tbody.empty();
    
        // Build table headers
        const headers = ['Front Design', 'Title', 'Sizes', 'Colors', 'Description', 'Tags'];
    
        // Add headers for additional print areas
        if (productData.print_areas) {
            productData.print_areas.forEach(function(area) {
                if (area.position !== 'front') {
                    headers.push(capitalizeFirstLetter(area.position) + ' Design');
                }
            });
        }
    
        let headerRow = '<tr>';
        headers.forEach(function(header) {
            headerRow += '<th>' + header + '</th>';
        });
        headerRow += '</tr>';
        thead.append(headerRow);
    
        // Build table row (for now, we have only one product)
        let row = '<tr>';
    
        // Front Design cell
        row += buildDesignCell(productData, 'front');
    
        // Title cell
        row += '<td class="editable" data-key="title">' + productData.title + '<button class="reset-button" title="Reset">&#8635;</button></td>';
    
        // Sizes cell
        row += '<td>' + getSizesString(productData) + '</td>';
    
        // Colors cell
        row += '<td>' + getColorsSwatches(productData) + '</td>';
    
        // Description cell
        row += '<td class="editable" data-key="description">' + truncateText(productData.description, 30) + '<button class="edit-button" title="Edit">&#9998;</button><button class="reset-button" title="Reset">&#8635;</button></td>';
    
        // Tags cell
        row += '<td class="editable" data-key="tags">' + productData.tags.join(', ') + '<button class="reset-button" title="Reset">&#8635;</button></td>';
    
        // Additional Design cells for other print areas
        if (productData.print_areas) {
            productData.print_areas.forEach(function(area) {
                if (area.position !== 'front') {
                    row += buildDesignCell(productData, area.position);
                }
            });
        }
    
        row += '</tr>';
        tbody.append(row);
    
        // Add event listeners
        addEventListeners();
    }

    // Helper functions
    function buildDesignCell(productData, position) {
        let cellContent = '<td>';

        const printArea = productData.print_areas.find(area => area.position === position);
        if (printArea && printArea.placeholders) {
            printArea.placeholders.images.forEach(function(image) {
                cellContent += '<div class="image-cell" data-image-id="' + image.id + '">';
                cellContent += '<img src="' + image.src + '" alt="' + image.name + '" class="image-thumbnail">';
                cellContent += '<span>' + image.name + '</span>';
                cellContent += '<button class="reset-image-button" title="Reset Image">&#8635;</button>';
                cellContent += '</div>';
            });
        }

        cellContent += '</td>';
        return cellContent;
    }

    function getSizesString(productData) {
        if (productData.options && productData.options.sizes) {
            return productData.options.sizes.map(size => size.title).join(', ');
        }
        return '';
    }

    function getColorsSwatches(productData) {
        let swatches = '';
        if (productData.options && productData.options.colors) {
            productData.options.colors.forEach(function(color) {
                swatches += '<span class="color-swatch" title="' + color.title + '" style="background-color:' + color.hex + ';"></span>';
            });
        }
        return swatches;
    }

    function truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Function to add event listeners to table elements
    function addEventListeners() {
        // Editable cells
        $('#creation-table td.editable').on('click', function() {
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
            });
        });

        // Reset buttons
        $('.reset-button').on('click', function(e) {
            e.stopPropagation();
            const cell = $(this).closest('td');
            const key = cell.data('key');
            resetCellValue(cell, key);
        });

        // Edit buttons (for description)
        $('.edit-button').on('click', function(e) {
            e.stopPropagation();
            const cell = $(this).closest('td');
            const key = cell.data('key');
            const currentText = cell.text().trim();
            openTextEditor(cell, key, currentText);
        });

        // Image reset buttons
        $('.reset-image-button').on('click', function(e) {
            e.stopPropagation();
            const imageCell = $(this).closest('.image-cell');
            resetImage(imageCell);
        });
    }

    // Function to update product data on the server
    function updateProductData(key, value) {
        // Prepare the data to send
        const updatedData = {
            key: key,
            value: value,
            template_name: selectedTemplateId // Send the template name to identify the data
        };
    
        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                action: 'sip_update_new_product_data',
                updated_data: updatedData,
                security: sipAjax.nonce
            },
            success: function(response) {
                if (!response.success) {
                    alert('Error updating product data: ' + response.data);
                }
            }
        });
    }

    // Function to reset cell value to template default
    function resetCellValue(cell, key) {
        // For simplicity, we'll reload the table
        // In a real implementation, you might fetch only the default value for the key
        const templateId = getSelectedTemplateId();
        loadProductCreationTable(templateId);
    }

    // Function to open text editor modal (for description)
    function openTextEditor(cell, key, currentText) {
        // Implement a modal or overlay with a textarea
        // For simplicity, we'll use prompt
        const newText = prompt('Edit Description:', currentText);
        if (newText !== null) {
            cell.text(newText);
            cell.append(cell.find('button'));
            updateProductData(key, newText);
        }
    }

    // Function to reset image to template default
    function resetImage(imageCell) {
        // Implement logic to reset the image
        // For simplicity, we'll reload the table
        const templateId = getSelectedTemplateId();
        loadProductCreationTable(templateId);
    }

    // Function to get the selected template ID
    function getSelectedTemplateId() {
        // Implement logic to retrieve the selected template ID
        // This might come from the previous user action
        return selectedTemplateId; // Assume this variable is set elsewhere
    }

    // Event listener for 'Create New Product' action
    // Replace this with the actual event in your application
    $('#create-product-button').on('click', function() {
        // Send a request to create the product
        $.ajax({
            url: sipAjax.ajax_url,
            method: 'POST',
            data: {
                action: 'sip_create_product',
                template_name: selectedTemplateId,
                security: sipAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('Product created successfully.');
                    // Optionally, redirect or update the UI
                } else {
                    alert('Error creating product: ' + response.data);
                }
            }
        });
    });
    

});
