// utilities.js

var sip = sip || {};

sip.utilities = (function($) {
    // Toast notification system
    var toastQueue = [];
    var isShowingToast = false;
    var currentToast = null;
    var spinnerVisible = false;

    function init() {
        // Add toast container to the body
        $('body').append('<div id="toast-container"></div>');

        // Initialize event handlers
        initCheckboxHandlers();
        initSearchHandlers();
        initImageSorting();

        // Initialize spinner
        initSpinner();
    }

    function createFormData(actionType, action) {
        var formData = new FormData();
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', actionType);
        formData.append(actionType, action);
        formData.append('nonce', sipAjax.nonce);
        return formData;
    }

    // Spinner functionality
    function initSpinner() {
        $(document).ready(function() {
            $('#spinner-overlay').show();
        });
    }

    function showSpinner() {
        $('#spinner-overlay').show();
        $('#spinner').show();
        spinnerVisible = true;
    }

    function hideSpinner() {
        $('#spinner-overlay').hide();
        $('#spinner').hide();
        spinnerVisible = false;
    }

    function isSpinnerVisible() {
        return $('#spinner-overlay').is(':visible');
    }

    // Toast functions
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

    // Checkbox handlers
    function initCheckboxHandlers() {
        $(document).on('change', '#select-all-images, #select-all-products, #select-all-templates', function() {
            var isChecked = $(this).is(':checked');
            var targetCheckboxes = $('input[name="' + $(this).attr('id').replace('select-all-', 'selected_') + '[]"]');
            targetCheckboxes.prop('checked', isChecked);
        });

        $(document).on('change', 'input[name="selected_images[]"], input[name="selected_products[]"], input[name="selected_templates[]"]', function() {
            var groupName = $(this).attr('name');
            var selectAllId = '#select-all-' + groupName.replace('selected_', '').replace('[]', '');
            var allChecked = $('input[name="' + groupName + '"]:checked').length === $('input[name="' + groupName + '"]').length;
            $(selectAllId).prop('checked', allChecked);
        });
    }

    // Search handlers
    function initSearchHandlers() {
        $('#product-search, #image-search, #template-search').on('keyup', function() {
            var value = $(this).val().toLowerCase();
            var targetTable = '#' + $(this).attr('id').replace('-search', '-table-list');
            
            $(targetTable + ' tbody tr').filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            });
        });
    }

    // Sorting functionality
    var sortOrder = ['upload_time'];
    var sortDirections = { 'upload_time': 'desc' };

    function initImageSorting() {
        $('#image-table-header').off('click', '.sortable').on('click', '.sortable', function(e) {
            handleSort.call(this);
        });
        updateSortIcons();
    
        // Apply initial sort
        var initialSortColumn = 'upload_time'; // or whatever column you want to sort by default
        var initialSortDirection = 'asc'; // or 'asc' if you prefer
        $('#image-table-header th[data-sort="' + initialSortColumn + '"]').addClass(initialSortDirection);
        sortRows(initialSortColumn, initialSortDirection);
        updateSortIcons();
    }

    function handleSort() {
        var $this = $(this);
        var column = $this.data('sort');
        var currentDirection = $this.hasClass('asc') ? 'asc' : 'desc';
        var newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    
        // Remove sorting classes from all headers
        $('#image-table-header th').removeClass('asc desc');
    
        // Add sorting class to current header
        $this.addClass(newDirection);
    
        sortRows(column, newDirection);
        updateSortIcons();
    
        // Store the current sort column and direction
        $('#image-table-header').data('sort-column', column);
        $('#image-table-header').data('sort-direction', newDirection);
    
    }

    function updateSortIcons() {
        $('.sortable').each(function() {
            var column = $(this).data('sort');
            var icon;
            if ($(this).hasClass('asc')) {
                icon = 'solid-up';
            } else if ($(this).hasClass('desc')) {
                icon = 'solid-down';
            } else {
                icon = 'outline-down';
            }
            $(this).find('svg').replaceWith($(getSortIcon(icon)));
        });
    }

    function sortRows(column, direction) {
        var $tbody = $('#image-table-content tbody');
        var rows = $tbody.find('tr').get();
    
        rows.sort(function(a, b) {
            var aValue = $(a).find('td').eq(getColumnIndex(column)).text().trim();
            var bValue = $(b).find('td').eq(getColumnIndex(column)).text().trim();
            
            var result = compareValues(aValue, bValue, column);
            
            // If the primary sort values are equal, use a secondary sort criterion
            if (result === 0) {
                var aSecondary = $(a).find('td').eq(getColumnIndex('file_name')).text().trim();
                var bSecondary = $(b).find('td').eq(getColumnIndex('file_name')).text().trim();
                result = aSecondary.localeCompare(bSecondary);
            }
            
            return result * (direction === 'asc' ? 1 : -1);
        });
    
        $.each(rows, function(index, row) {
            $tbody.append(row);
        });
    }

    function compareValues(a, b, column) {
    
        var result;
        if (column === 'upload_time') {
            result = compareDates(a, b);
        } else if (column === 'dimensions') {
            result = comparePixels(a, b);
        } else if (column === 'size') {
            result = compareFileSize(a, b);
        } else {
            result = a.localeCompare(b);
        }
        return result;
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

    // Comparison functions
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
        if ((a === '' || a === 'Local File') && (b === '' || b === 'Local File')) return 0;
        if (a === '' || a === 'Local File') return 1;
        if (b === '' || b === 'Local File') return -1;
    
        var dateA = parseCustomDate(a);
        var dateB = parseCustomDate(b);
    
        return dateB - dateA;  // This will sort in descending order (newest first)
    }
    
    function parseCustomDate(dateString) {
        if (dateString.includes('_')) {
            // Parse the custom format (e.g., "23_10_11 2:30pm")
            var parts = dateString.split(' ');
            var dateParts = parts[0].split('_');
            var timeParts = parts[1].split(':');
            
            var year = parseInt('20' + dateParts[0]);
            var month = parseInt(dateParts[1]) - 1;
            var day = parseInt(dateParts[2]);
            
            var hour = parseInt(timeParts[0]);
            var minute = parseInt(timeParts[1].substring(0, 2));
            
            if (timeParts[1].toLowerCase().includes('pm') && hour !== 12) {
                hour += 12;
            }
            if (timeParts[1].toLowerCase().includes('am') && hour === 12) {
                hour = 0;
            }
    
            return new Date(year, month, day, hour, minute);
        } else {
            // Parse ISO 8601 format (e.g., "2023-10-11T14:30:00Z")
            return new Date(dateString);
        }
    }

    // SVG icon generation
    function getSortIcon(type) {
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


    // Expose public methods
    return {
        init: init,
        showToast: showToast,
        showSpinner: showSpinner,
        hideSpinner: hideSpinner,
        isSpinnerVisible: isSpinnerVisible,
        initImageSorting: initImageSorting,
        getSortIcon: getSortIcon,
        comparePixels: comparePixels,
        compareFileSize: compareFileSize,
        compareDates: compareDates,
        parseCustomDate: parseCustomDate,
        createFormData: createFormData
    };
})(jQuery);