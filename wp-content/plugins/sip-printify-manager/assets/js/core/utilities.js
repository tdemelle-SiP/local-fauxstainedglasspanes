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
        initSortHandlers();

        // Initialize spinner
        initSpinner();
    }

    // Spinner functionality
    function initSpinner() {
        $(document).ready(function() {
            $('#spinner-overlay').show();
        });

        $(window).on('load', function() {
            $('#spinner-overlay').hide();
        });
    }

    function showSpinner() {
        $('#spinner-overlay').show();
        spinnerVisible = true;
    }

    function hideSpinner() {
        $('#spinner-overlay').hide();
        spinnerVisible = false;
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

    function initSortHandlers() {
        $('#image-table-header').on('click', '.sortable', handleSort);
        updateSortIcons();
    }

    function handleSort() {
        var column = $(this).data('sort');

        if (sortOrder[0] === column) {
            sortDirections[column] = sortDirections[column] === 'asc' ? 'desc' : 'asc';
        } else {
            sortOrder = [column].concat(sortOrder.filter(col => col !== column));
            if (sortOrder.length > 2) sortOrder.pop();
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
            $(this).find('svg').replaceWith($(getSortIcon(icon)));
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

        return dateB - dateA;
    }

    function parseCustomDate(dateString) {
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
        initSortHandlers: initSortHandlers,
        getSortIcon: getSortIcon,
        comparePixels: comparePixels,
        compareFileSize: compareFileSize,
        compareDates: compareDates,
        parseCustomDate: parseCustomDate
    };
})(jQuery);

// Initialize utilities when the document is ready
jQuery(document).ready(function() {
    sip.utilities.init();
});