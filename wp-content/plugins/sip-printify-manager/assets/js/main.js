// main.js
var sip = sip || {};

sip.main = (function($, ajax, utilities) {
    var isInitialized = false;

    function initialize() {
        if (isInitialized) {
            console.log('SiP Printify Manager already initialized');
            return;
        }
        isInitialized = true;
        
        utilities.showSpinner();

        initializeModules();
        initializeGlobalEventListeners();

        setTimeout(function() {
            if (utilities.isSpinnerVisible()) {
                console.log('Failsafe: Hiding spinner after timeout');
                utilities.hideSpinner();
            }
        }, 10000);
    }

    function initializeModules() {
        var modules = [
            'utilities',
            'ajax',
            'shopActions',
            'productActions',
            'imageActions',
            'templateActions',
            'creationActions'
        ];

        modules.forEach(function(module) {
            if (sip[module] && typeof sip[module].init === 'function') {
                sip[module].init();
            }
        });
    }

    function initializeGlobalEventListeners() {
        $(document).on('sip:globalEvent', function(e, data) {
            console.log('Global event triggered:', data);
        });

        $(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
            console.error('AJAX error:', thrownError);
            utilities.showToast('An error occurred. Please try again.', 5000);
            utilities.hideSpinner();
        });
    }

    // Global error handler
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Global error:', message, 'at', source, 'line', lineno, ':', error);
        return false;
    };

    // Public API
    return {
        initialize: initialize
    };
})(jQuery, sip.ajax, sip.utilities);

// Initialize when the document is ready
jQuery(document).ready(function() {
    sip.main.initialize();
});