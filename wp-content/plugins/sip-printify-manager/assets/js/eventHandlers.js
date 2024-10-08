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
    }

    /**
     * Generates SVG icon for sorting
     * @param {string} type - The type of icon to generate ('outline-up', 'outline-down', 'solid-up', 'solid-down')
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
            default:
                return '';
        }
    }

    /**
     * Initializes and handles image sorting functionality
     */
    function initImageSorting() {
        var sortOrder = [];

        // Set initial sort on upload_time
        $('[data-sort="upload_time"]').addClass('current-sort desc');
        sortOrder.push({ column: 'upload_time', direction: 'desc' });

        /**
         * Updates sort icons for a column
         * @param {jQuery} $column - The column header jQuery object
         * @param {string} direction - The sort direction ('asc' or 'desc')
         */
        function updateSortIcons($column, direction) {
            if ($column.hasClass('current-sort')) {
                $column.find('svg').replaceWith($(sip_get_sort_icon(direction === 'asc' ? 'solid-up' : 'solid-down')));
            } else if ($column.hasClass('secondary-sort')) {
                $column.find('svg').replaceWith($(sip_get_sort_icon(direction === 'asc' ? 'solid-up' : 'solid-down')));
            } else {
                $column.find('svg').replaceWith($(sip_get_sort_icon(direction === 'asc' ? 'outline-up' : 'outline-down')));
            }
        }

        /**
         * Gets the index of a column in the table
         * @param {string} column - The column name
         * @returns {number} The index of the column
         */
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

        /**
         * Compares two values for sorting
         * @param {HTMLElement} a - First table row
         * @param {HTMLElement} b - Second table row
         * @param {Object} sortItem - Sort configuration object
         * @returns {number} Comparison result
         */
        function compareValues(a, b, sortItem) {
            var A = $(a).children('td').eq(getColumnIndex(sortItem.column)).text().toUpperCase();
            var B = $(b).children('td').eq(getColumnIndex(sortItem.column)).text().toUpperCase();
            var result;

            if (sortItem.column === 'upload_time') {
                result = compareDates(A, B);
            } else if (sortItem.column === 'dimensions') {
                result = comparePixels(A, B);
            } else if (sortItem.column === 'size') {
                result = compareFileSize(A, B);
            } else {
                result = A.localeCompare(B);
            }

            return sortItem.direction === 'asc' ? result : -result;
        }

        /**
         * Compares two pixel dimensions
         * @param {string} a - First dimension string
         * @param {string} b - Second dimension string
         * @returns {number} Comparison result
         */
        function comparePixels(a, b) {
            var pixelsA = a.split('x').reduce((a, b) => parseInt(a) * parseInt(b), 1);
            var pixelsB = b.split('x').reduce((a, b) => parseInt(a) * parseInt(b), 1);
            return pixelsA - pixelsB;
        }

        /**
         * Compares two file sizes
         * @param {string} a - First file size string
         * @param {string} b - Second file size string
         * @returns {number} Comparison result
         */
        function compareFileSize(a, b) {
            var sizeA = parseFloat(a);
            var sizeB = parseFloat(b);
            if (a.includes('MB')) sizeA *= 1024;
            if (b.includes('MB')) sizeB *= 1024;
            return sizeA - sizeB;
        }

        /**
         * Compares two dates
         * @param {string} a - First date string
         * @param {string} b - Second date string
         * @returns {number} Comparison result
         */
        function compareDates(a, b) {
            return new Date(b) - new Date(a);
        }

        // Attach click event to sortable headers
        $('.sortable').on('click', function() {
            var $this = $(this);
            var column = $this.data('sort');

            // Remove this column from the sort order if it's already there
            sortOrder = sortOrder.filter(item => item.column !== column);

            // Add this column to the beginning of the sort order
            if ($this.hasClass('asc')) {
                sortOrder.unshift({ column: column, direction: 'desc' });
                $this.removeClass('asc').addClass('desc');
            } else {
                sortOrder.unshift({ column: column, direction: 'asc' });
                $this.removeClass('desc').addClass('asc');
            }

            // Limit to primary and secondary sorts
            sortOrder = sortOrder.slice(0, 2);

            // Update classes and icons
            $('.sortable').removeClass('current-sort secondary-sort');
            sortOrder.forEach((item, index) => {
                var $col = $('[data-sort="' + item.column + '"]');
                if (index === 0) {
                    $col.addClass('current-sort');
                } else if (index === 1) {
                    $col.addClass('secondary-sort');
                }
                updateSortIcons($col, item.direction);
            });

            // Sort the rows
            var $tbody = $('#image-table-content tbody');
            var rows = $tbody.find('tr').get();

            rows.sort(function(a, b) {
                for (var i = 0; i < sortOrder.length; i++) {
                    var result = compareValues(a, b, sortOrder[i]);
                    if (result !== 0) return result;
                }
                return 0;
            });

            $.each(rows, function(index, row) {
                $tbody.append(row);
            });
        });

        // Initial update of sort icons
        $('.sortable').each(function() {
            var $col = $(this);
            var direction = $col.hasClass('asc') ? 'asc' : 'desc';
            updateSortIcons($col, direction);
        });
    }

    /**
     * Displays a toast notification
     * @param {string} message - The message to display
     * @param {number} duration - Duration to show the toast (in milliseconds)
     * @param {boolean} waitForSpinner - Whether to wait for the spinner to disappear
     */
    function showToast(message, duration = 3000, waitForSpinner = false) {
        toastQueue.push({ message, duration, waitForSpinner });
        if (!isShowingToast) {
            displayNextToast();
        }
    }

    /**
     * Displays the next toast in the queue
     */
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

    /**
     * Checks if the current toast should be removed
     */
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

    /**
     * Sets the visibility of the spinner
     * @param {boolean} visible - Whether the spinner should be visible
     */
    function setSpinnerVisibility(visible) {
        spinnerVisible = visible;
    }

    // Initialize image sorting when the document is ready
    $(document).ready(function() {
        initImageSorting();
    });

    // Expose public methods
    return {
        init: init,
        showToast: showToast,
        setSpinnerVisibility: setSpinnerVisibility
    };
})(jQuery);