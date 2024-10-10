// main.js

var sip = sip || {};

(function($) {
    $(document).ready(function() {
        // Initialize all modules
        sip.init.initializeAllModules();

        // Any global event listeners or functionality can be added here

        // Example of a global event listener
        $(document).on('click', '.sip-global-action', function(e) {
            e.preventDefault();
            // Handle global action
        });
    });
})(jQuery);