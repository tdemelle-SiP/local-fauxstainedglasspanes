var sip = sip || {};

// Product creation initialization
sip.productCreation = (function($) {
    let selectedTemplateId = null;

    // Initialize event listeners
    function init() {
        // Log initialization
        console.log('Initializing product creation...');

        // Event listener for form submission (template-action-form)
        $('#template-action-form').on('submit', function(e) {
            console.log('Form submission detected for template-action-form...');
            e.preventDefault();

            // Check the selected action in the dropdown
            const action = $('#template_action').val();
            console.log('Selected action:', action);

            if (action === 'create_new_products') {
                console.log('create_new_products action detected...');

                const selectedTemplates = $('input[name="selected_templates[]"]:checked');
                if (selectedTemplates.length === 0) {
                    alert('Please select at least one template.');
                    return;
                }

                // Use the first selected template
                selectedTemplateId = selectedTemplates.first().val();
                console.log('Selected template ID:', selectedTemplateId);

                // Call the function to load the Product Creation Table
                loadProductCreationTable(selectedTemplateId);
            }
        });

        // Event listener for 'Create Product' button
        $('#create-product-button').on('click', function() {
            console.log('Create Product button clicked...');

            // Send a request to create the product
            $.ajax({
                url: sipAjax.ajax_url,
                method: 'POST',
                data: {
                    action: 'sip_create_product',
                    template_name: selectedTemplateId,
                    nonce: sipAjax.nonce
                },
                success: function(response) {
                    console.log('Create product response:', response);
                    if (response.success) {
                        alert('Product created successfully.');
                    } else {
                        alert('Error creating product: ' + response.data);
                    }
                },
                error: function() {
                    console.error('Error in Create Product AJAX call');
                }
            });
        });
    }


// Function to load the Product Creation Table when a template is selected
function loadProductCreationTable(templateName) {
    console.log('Loading Product Creation Table for template:', templateName);

    // Show the product creation container if it's hidden
    $('#product-creation-container').show();

    // Show the spinner while waiting for the AJAX response
    $('#loading-spinner').show();
    $('#spinner-overlay').show();

    // Make an AJAX call to fetch the new product JSON
    $.ajax({
        url: sipAjax.ajax_url,
        method: 'POST',
        data: {
            sip_printify_manager_nonce_field: sipAjax.nonce, // Include the nonce
            action: 'sip_handle_ajax_request',
            action_type: 'template_action',
            template_action: 'create_new_products',
            template_name: templateName,
            nonce: sipAjax.nonce

        },
        success: function(response) {
            console.log('AJAX response received:', response);

            // Hide the spinner when response is received
            $('#loading-spinner').hide();
            $('#spinner-overlay').hide();

            if (response.success) {
                // Build the table with the received data
                console.log('Calling buildCreationTable with data:', response.data);
                buildCreationTable(response.data); // Build the table
            } else {
                console.error('Error in AJAX response:', response.data);
                alert('Error: ' + response.data);
            }
        },
        error: function() {
            console.error('AJAX call failed.');
            $('#loading-spinner').hide(); // Hide spinner in case of error
            $('#spinner-overlay').hide();
        }
    });
}


// Function to build the Product Creation Table with the data from the server
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

    // Add headers for additional print areas
    if (productData.print_areas) {
        productData.print_areas.forEach(function(area) {
            if (area.position && typeof area.position === 'string') {
                headers.push(capitalizeFirstLetter(area.position) + ' Design');
            } else {
                console.error('Invalid or missing position in print_areas:', area);
            }
        });
    }

    let headerRow = '<tr>';
    headers.forEach(function(header) {
        headerRow += '<th>' + header + '</th>';
    });
    headerRow += '</tr>';
    thead.append(headerRow);
    console.log('Table headers added:', headers);

    // Correctly handle the sizes and colors, accounting for different key names
    const sizes = productData['options - sizes'] ? productData['options - sizes'] : [];
    const colors = productData['options - colors'] ? productData['options - colors'] : [];

    // Build table row with product data
    let row = '<tr>';
    row += buildDesignCell(productData, 'front');  // Front Design cell
    row += '<td class="editable" data-key="title">' + productData.title + '<button class="reset-button" title="Reset">&#8635;</button></td>';
    row += '<td>' + getSizesString(sizes) + '</td>';  // Sizes data
    row += '<td>' + getColorsSwatches(colors) + '</td>';  // Colors data
    row += '<td class="editable" data-key="description">' + truncateText(productData.description, 30) + '<button class="edit-button" title="Edit">&#9998;</button><button class="reset-button" title="Reset">&#8635;</button></td>';
    row += '<td class="editable" data-key="tags">' + productData.tags.join(', ') + '<button class="reset-button" title="Reset">&#8635;</button></td>';

    // Add additional design cells for other print areas
    if (productData.print_areas) {
        productData.print_areas.forEach(function(area) {
            if (area.placeholders && area.placeholders.length > 0) {
                row += buildDesignCell(productData, area.placeholders[0].position);
            }
        });
    }

    row += '</tr>';
    tbody.append(row);
    console.log('Table row added:', row);

    // Add event listeners for table actions (edit, reset)
    addEventListeners();
    console.log('Event listeners added.');
}


    // Function to build design cells for each print area
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

    // Capitalize the first letter function
    function capitalizeFirstLetter(string) {
        if (typeof string === 'string' && string.length > 0) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
        return '';  // Return an empty string for non-valid inputs
    }
    // Function to add event listeners to table elements
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
                sip_printify_manager_nonce_field: sipAjax.nonce,
                _wp_http_referer: '/wp-admin/admin.php?page=sip-printify-manager',
                action: 'sip_handle_ajax_request',
                action_type: 'creation_action',
                creation_action: 'update_new_product',
                updated_data: updatedData,
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
        loadProductCreationTable(selectedTemplateId);
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
        loadProductCreationTable(selectedTemplateId);
    }

    // Expose the init function
    return {
        init: init,
        buildCreationTable: buildCreationTable
    };
})(jQuery);
