// spinner.js

/**
 * Manages the display of the spinner overlay during AJAX requests and page loads
 */

var sip = sip || {};

sip.spinner = (function($) {
    function init() {
        // Hide the spinner once the entire page has fully loaded
        window.addEventListener('load', function() {
            $('#spinner-overlay').hide();
        });

        // For page load spinner
        document.addEventListener('DOMContentLoaded', function() {
            const spinnerSelector = '#spinner-overlay';  // Define your spinner selector here
            $(spinnerSelector).show();  // Show spinner when the page starts loading
        });

        window.addEventListener('load', function() {
            const spinnerSelector = '#spinner-overlay';  // Define your spinner selector here
            $(spinnerSelector).hide();  // Hide spinner once the page is fully loaded
        });
    }

    return {
        init: init
    };
})(jQuery);
