// init.js
var sip = sip || {};

sip.init = (function($, ajax, utilities) {
    var isInitialized = false;

    function initializeAllModules() {
        if (isInitialized) {
            console.log('Modules already initialized');
            return;
        }
        isInitialized = true;
        
        utilities.showSpinner(); // Show spinner at the start of initialization

        // Initialize utilities module
        if (sip.utilities && typeof sip.utilities.init === 'function') {
            sip.utilities.init();
        }

        // Initialize ajax module
        if (sip.ajax && typeof sip.ajax.init === 'function') {
            sip.ajax.init();
        }

        // Initialize shop actions module
        if (sip.shopActions && typeof sip.shopActions.init === 'function') {
            sip.shopActions.init();
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

        // Initialize creation actions module
        if (sip.creationActions && typeof sip.creationActions.init === 'function') {
            sip.creationActions.init();
        }

        setTimeout(function() {
            if (utilities.isSpinnerVisible()) {
                console.log('Failsafe: Hiding spinner after timeout');
                utilities.hideSpinner();
            }
        }, 10000);
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
            utilities.hideSpinner(); // 
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