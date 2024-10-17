// main.js
var sip = sip || {};
console.log('main.js loaded successfully');

sip.main = (function($, ajax, utilities) {
    var isInitialized = false;

    function initialize() {
        if (isInitialized) {
            console.log('SiP Printify Manager already initialized');
            return;
        }
        isInitialized = true;
        
        console.log('*****ShowSpinner called on initialization in main.js');
        utilities.showSpinner();

        console.log('Initializing Modules');
        initializeModules();
        initializeGlobalEventListeners();
    }

    function initializeModules() {
        var modules = [
            'utilities',
            'ajax',
            'productActions',
            'imageActions',
            'templateActions',
            'creationActions',
            'shopActions'
        ];

        modules.forEach(function(module) {
            if (sip[module] && typeof sip[module].init === 'function') {
                console.log('Initializing module:', module);
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
            console.log('***Hiding spinner after AJAX error');
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