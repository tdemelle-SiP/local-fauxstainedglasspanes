// eventHandlers.js

/**
 * Contains event listeners and handlers for various UI interactions, such as select-all checkboxes,
 * search functionality, image sorting, and toast notifications.
 */
var sip = sip || {};

sip.eventHandlers = (function($) {
    // Variables for toast notifications
    var toastQueue = [];
    var isShowingToast = false;
    var currentToast = null;
    var spinnerVisible = false;
    var sortOrder = ['upload_time'];
    var sortDirections = { 'upload_time': 'desc' };

    /**
     * Initializes all event handlers and UI components
     */
    function init() {
        // Add toast container to the body
        $('body').append('<div id="toast-container"></div>');

        // Select All / Deselect All functionality for images
        $(document).on('change', '#select-all-images', function () {
            var isChecked = $(this).is(':checked');
            $('input[name="selected_images[]"]').prop('checked', isChecked);
        });

        // Handle individual image checkbox changes
        $(document).on('change', 'input[name="selected_images[]"]', function () {
            if (!$(this).is(':checked')) {
                $('#select-all-images').prop('checked', false);
            } else {
                // If all individual checkboxes are checked, check the select-all checkbox
                if ($('input[name="selected_images[]"]:checked').length === $('input[name="selected_images[]"]').length) {
                    $('#select-all-images').prop('checked', true);
                }
            }
        });

        // Select All / Deselect All functionality for products
        $(document).on('change', '#select-all-products', function () {
            var isChecked = $(this).is(':checked');
            $('input[name="selected_products[]"]').prop('checked', isChecked);
        });

        // Handle individual product checkbox changes
        $(document).on('change', 'input[name="selected_products[]"]', function () {
            if (!$(this).is(':checked')) {
                $('#select-all-products').prop('checked', false);
            } else {
                // If all individual checkboxes are checked, check the select-all checkbox
                if ($('input[name="selected_products[]"]:checked').length === $('input[name="selected_products[]"]').length) {
                    $('#select-all-products').prop('checked', true);
                }
            }
        });

        // Select All / Deselect All functionality for templates
        $(document).on('change', '#select-all-templates', function () {
            var isChecked = $(this).is(':checked');
            $('input[name="selected_templates[]"]').prop('checked', isChecked);
        });

        // Handle individual template checkbox changes
        $(document).on('change', 'input[name="selected_templates[]"]', function () {
            if (!$(this).is(':checked')) {
                $('#select-all-templates').prop('checked', false);
            } else {
                // If all individual checkboxes are checked, check the select-all checkbox
                if ($('input[name="selected_templates[]"]:checked').length === $('input[name="selected_templates[]"]').length) {
                    $('#select-all-templates').prop('checked', true);
                }
            }
        });

        // Search functionality for products
        $('#product-search').on('keyup', function () {
            var value = $(this).val().toLowerCase();
            $('#product-table-list tbody tr').filter(function () {
                $(this).toggle($(this).find('td:nth-child(3)').text().toLowerCase().indexOf(value) > -1);
            });
        });

        // Search functionality for images
        $('#image-search').on('keyup', function () {
            var value = $(this).val().toLowerCase();
            $('#image-table-list table tbody tr').filter(function () {
                // Check if the filename or other relevant text in the row contains the search term
                var rowText = $(this).text().toLowerCase();
                $(this).toggle(rowText.indexOf(value) > -1);
            });
        });

        // Search functionality for templates
        $('#template-search').on('keyup', function () {
            var value = $(this).val().toLowerCase();
            $('#template-table-list tbody tr').filter(function () {
                $(this).toggle($(this).find('td:nth-child(2)').text().toLowerCase().indexOf(value) > -1);
            });
        });

        // Initialize image sorting
        initImageSorting();
    }

    /**
     * Generates SVG icon for sorting
     * @param {string} type - The type of icon to generate ('outline-up', 'outline-down', 'solid-up', 'solid-down', 'dim-up', 'dim-down')
     * @returns {string} SVG markup for the requested icon
     */
    function sip_get_sort_icon(type) {
        switch (type) {
            case 'outline-up':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L10 10 L0 10 Z" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
            case 'outline-down':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0 L10 0 L5 10 Z" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
            case 'solid-up':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L10 10 L0 10 Z" fill="currentColor"/></svg>';
            case 'solid-down':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0 L10 0 L5 10 Z" fill="currentColor"/></svg>';
            case 'dim-up':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L10 10 L0 10 Z" fill="#FFFFFF80" stroke="currentColor" stroke-width="1"/></svg>';
            case 'dim-down': 
                return '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0 L10 0 L5 10 Z" fill="#FFFFFF80" stroke="currentColor" stroke-width="1"/></svg>';
            default:
                return '';
        }
    }

    /**
     * Initializes and handles image sorting functionality
     */
    function initImageSorting() {
        // Set initial sort on upload_time
        updateSortIcons();

        // Use event delegation for sorting
        $('#image-table-header').on('click', '.sortable', handleSort);
    }

    function handleSort() {
        var column = $(this).data('sort');

        if (sortOrder[0] === column) {
            // Toggle direction of primary sort
            sortDirections[column] = sortDirections[column] === 'asc' ? 'desc' : 'asc';
        } else {
            // Move this column to primary sort
            sortOrder = [column].concat(sortOrder.filter(col => col !== column));
            if (sortOrder.length > 2) sortOrder.pop(); // Keep only top 2
            if (!(column in sortDirections)) sortDirections[column] = 'asc';
        }

        updateSortIcons();
        sortRows();
    }

    function updateSortIcons() {
        $('.sortable').each(function() {
            var column = $(this).data('sort');
            var icon;
            if (sortOrder[0] === column) {
                icon = sortDirections[column] === 'asc' ? 'solid-up' : 'solid-down';
            } else if (sortOrder[1] === column) {
                icon = sortDirections[column] === 'asc' ? 'dim-up' : 'dim-down';
            } else {
                icon = 'outline-down';
            }
            $(this).find('svg').replaceWith($(sip_get_sort_icon(icon)));
        });
    }

    function sortRows() {
        var $tbody = $('#image-table-content tbody');
        var rows = $tbody.find('tr').get();

        rows.sort(function(a, b) {
            for (var i = 0; i < sortOrder.length; i++) {
                var column = sortOrder[i];
                var result = compareValues(a, b, column);
                if (result !== 0) return sortDirections[column] === 'asc' ? result : -result;
            }
            return 0;
        });

        $.each(rows, function(index, row) {
            $tbody.append(row);
        });
    }

    function compareValues(a, b, column) {
        var aValue = $(a).find('td').eq(getColumnIndex(column)).text().trim();
        var bValue = $(b).find('td').eq(getColumnIndex(column)).text().trim();

        if (column === 'upload_time') return compareDates(aValue, bValue);
        if (column === 'dimensions') return comparePixels(aValue, bValue);
        if (column === 'size') return compareFileSize(aValue, bValue);
        return aValue.localeCompare(bValue);
    }

    function getColumnIndex(column) {
        switch (column) {
            case 'file_name': return 2;
            case 'location': return 3;
            case 'upload_time': return 4;
            case 'dimensions': return 5;
            case 'size': return 6;
            default: return 0;
        }
    }

    function comparePixels(a, b) {
        var pixelsA = a.split('x').reduce((a, b) => parseInt(a) * parseInt(b), 1);
        var pixelsB = b.split('x').reduce((a, b) => parseInt(a) * parseInt(b), 1);
        return pixelsA - pixelsB;
    }

    function compareFileSize(a, b) {
        var sizeA = parseFloat(a);
        var sizeB = parseFloat(b);
        if (a.includes('MB')) sizeA *= 1024;
        if (b.includes('MB')) sizeB *= 1024;
        return sizeA - sizeB;
    }

    function compareDates(a, b) {
        // If both dates are empty or 'Local File', consider them equal
        if ((a === '' || a === 'Local File') && (b === '' || b === 'Local File')) return 0;
        
        // If only a is empty or 'Local File', consider it older
        if (a === '' || a === 'Local File') return 1;
        
        // If only b is empty or 'Local File', consider it older
        if (b === '' || b === 'Local File') return -1;

        // Parse the date strings
        var dateA = parseCustomDate(a);
        var dateB = parseCustomDate(b);

        // Compare the dates
        return dateB - dateA;
    }

    function parseCustomDate(dateString) {
        // Expected format: "YY_MM_DD h:mma"
        var parts = dateString.split(' ');
        var dateParts = parts[0].split('_');
        var timeParts = parts[1].split(':');
        
        var year = parseInt('20' + dateParts[0]); // Assuming years are in the 2000s
        var month = parseInt(dateParts[1]) - 1; // JavaScript months are 0-indexed
        var day = parseInt(dateParts[2]);
        
        var hour = parseInt(timeParts[0]);
        var minute = parseInt(timeParts[1].substring(0, 2));
        
        // Adjust for PM
        if (timeParts[1].toLowerCase().includes('pm') && hour !== 12) {
            hour += 12;
        }
        // Adjust for AM 12:xx (midnight)
        if (timeParts[1].toLowerCase().includes('am') && hour === 12) {
            hour = 0;
        }

        return new Date(year, month, day, hour, minute);
    }

    function showToast(message, duration = 3000, waitForSpinner = false) {
        toastQueue.push({ message, duration, waitForSpinner });
        if (!isShowingToast) {
            displayNextToast();
        }
    }

    function displayNextToast() {
        if (toastQueue.length === 0) {
            isShowingToast = false;
            currentToast = null;
            return;
        }

        isShowingToast = true;
        var { message, duration, waitForSpinner } = toastQueue.shift();
        var toast = $('<div class="toast"></div>').text(message);
        $('#toast-container').append(toast);

        toast.fadeIn(400);
        currentToast = { element: toast, startTime: Date.now(), duration, waitForSpinner };

        checkToastDuration();
    }

    function checkToastDuration() {
        if (!currentToast) return;

        var now = Date.now();
        var elapsedTime = now - currentToast.startTime;

        if (elapsedTime >= currentToast.duration && (!currentToast.waitForSpinner || !spinnerVisible)) {
            currentToast.element.fadeOut(400, function() {
                $(this).remove();
                displayNextToast();
            });
        } else {
            setTimeout(checkToastDuration, 100);
        }
    }

    function setSpinnerVisibility(visible) {
        spinnerVisible = visible;
    }

    // Expose public methods
    return {
        init: init,
        showToast: showToast,
        setSpinnerVisibility: setSpinnerVisibility,
        initImageSorting: initImageSorting
    };
})(jQuery);