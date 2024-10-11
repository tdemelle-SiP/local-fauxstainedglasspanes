// init.js

var sip = sip || {};

sip.init = (function($, ajax, utilities) {
    function initializeAllModules() {
        // Initialize ajax module
        if (sip.ajax && typeof sip.ajax.init === 'function') {
            sip.ajax.init();
        }

        // Initialize utilities module
        if (sip.utilities && typeof sip.utilities.init === 'function') {
            sip.utilities.init();
        }

        // Initialize product actions module
        if (sip.productActions && typeof sip.productActions.init === 'function') {
            sip.productActions.init();
        }

        // Initialize image actions module
        if (sip.imageActions && typeof sip.imageActions.init === 'function') {
            sip.imageActions.init();
        }

        // Initialize template actions module
        if (sip.templateActions && typeof sip.templateActions.init === 'function') {
            sip.templateActions.init();
        }

        // Initialize template actions module
        if (sip.templateActions && typeof sip.templateActions.init === 'function') {
            console.log('Initializing template actions module');
            sip.templateActions.init();
        } else {
            console.warn('Template actions module not found or init function not defined');
        }

        // Initialize creation actions module
        if (sip.creationActions && typeof sip.creationActions.init === 'function') {
            sip.creationActions.init();
        }

        // Add any other module initializations here
    }

    function initializeGlobalEventListeners() {
        // Add any global event listeners here
        $(document).on('sip:globalEvent', function(e, data) {
            // Handle global custom events
            console.log('Global event triggered:', data);
        });

        // Example: Global error handler
        $(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
            console.error('AJAX error:', thrownError);
            utilities.showToast('An error occurred. Please try again.', 5000);
        });
    }

    return {
        initializeAllModules: initializeAllModules,
        initializeGlobalEventListeners: initializeGlobalEventListeners
    };
})(jQuery, sip.ajax, sip.utilities);

// Initialize everything when the document is ready
jQuery(document).ready(function() {
    sip.init.initializeAllModules();
    sip.init.initializeGlobalEventListeners();
});