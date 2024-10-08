// eventHandlers.js

/**
 * Contains event listeners and handlers for various UI interactions, such as select-all checkboxes and search functionality
 */
var sip = sip || {};

sip.eventHandlers = (function($) {
    var toastQueue = [];
    var isShowingToast = false;
    var currentToast = null;
    var spinnerVisible = false;


    function init() {

        // Add toast container to the body
        $('body').append('<div id="toast-container"></div>');


        ///////////////////////////////SELECT ALL AND SEARCH FUNCTIONALITY////////////////////////////////////////
        /**
         * Select All / Deselect All functionality for images.
         * When the select-all checkbox is changed, all individual image checkboxes are set accordingly.
         */
        $(document).on('change', '#select-all-images', function () {
            var isChecked = $(this).is(':checked');
            $('input[name="selected_images[]"]').prop('checked', isChecked);
        });

        /**
         * Ensure that if any individual image checkbox is unchecked, the select-all checkbox is also unchecked.
         */
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

        /**
         * Select All / Deselect All functionality for products.
         * When the select-all checkbox is changed, all individual product checkboxes are set accordingly.
         */
        $(document).on('change', '#select-all-products', function () {
            var isChecked = $(this).is(':checked');
            $('input[name="selected_products[]"]').prop('checked', isChecked);
        });

        /**
         * Ensure that if any individual product checkbox is unchecked, the select-all checkbox is also unchecked.
         */
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

        /**
         * Select All / Deselect All functionality for templates.
         * When the select-all checkbox is changed, all individual template checkboxes are set accordingly.
         */
        $(document).on('change', '#select-all-templates', function () {
            var isChecked = $(this).is(':checked');
            $('input[name="selected_templates[]"]').prop('checked', isChecked);
        });

        /**
         * Ensure that if any individual template checkbox is unchecked, the select-all checkbox is also unchecked.
         */
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

        /**
         * Search functionality for products.
         * Filters the products table based on the search input value
         */
        $('#product-search').on('keyup', function () {
            var value = $(this).val().toLowerCase();
            $('#product-table-list tbody tr').filter(function () {
                $(this).toggle($(this).find('td:nth-child(3)').text().toLowerCase().indexOf(value) > -1);
            });
        });

        /* Search functionality for images. */
        $('#image-search').on('keyup', function () {
            var value = $(this).val().toLowerCase();
            $('#image-table-list table tbody tr').filter(function () {
                // Check if the filename or other relevant text in the row contains the search term
                var rowText = $(this).text().toLowerCase();
                $(this).toggle(rowText.indexOf(value) > -1);
            });
        });

        /* Search functionality for templates. */
        $('#template-search').on('keyup', function () {
            var value = $(this).val().toLowerCase();
            $('#template-table-list tbody tr').filter(function () {
                $(this).toggle($(this).find('td:nth-child(2)').text().toLowerCase().indexOf(value) > -1);
            });
        });
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

    // Expose the init function
    return {
        init: init,
        showToast: showToast,
        setSpinnerVisibility: setSpinnerVisibility        
    };
})(jQuery);
