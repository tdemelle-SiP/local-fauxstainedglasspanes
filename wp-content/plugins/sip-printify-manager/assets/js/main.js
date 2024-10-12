// main.js

var sip = sip || {};

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at', source, 'line', lineno, ':', error);
    return false;
};

(function($) {
    $(document).ready(function() {
        // Initialize all modules
        if (sip.init && typeof sip.init.initializeAllModules === 'function') {
            sip.init.initializeAllModules();
        } else {
            console.error('sip.init.initializeAllModules is not a function');
        }

        // Check if template actions module is properly loaded
        if (sip.templateActions && typeof sip.templateActions.handleSuccessResponse === 'function') {
            console.log('Template actions module successfully loaded');
        } else {
            console.error('Template actions module not properly loaded');
        }

        // Any global event listeners or functionality can be added here

        // Example of a global event listener
        $(document).on('click', '.sip-global-action', function(e) {
            e.preventDefault();
            // Handle global action
        });
    });
})(jQuery);