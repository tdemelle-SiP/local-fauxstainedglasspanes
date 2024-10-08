// main.js

/**
 * Entry point for the SIP Printify Manager plugin
 * Initializes the plugin and imports other modules
 */

var sip = sip || {};

jQuery(document).ready(function($) {
    // Initialize modules
    if (sip.spinner && typeof sip.spinner.init === 'function') {
        sip.spinner.init();
    }
    if (sip.ajaxModule && typeof sip.ajaxModule.init === 'function') {
        sip.ajaxModule.init();
    }
    if (sip.productCreation && typeof sip.productCreation.init === 'function') {
        sip.productCreation.init();
    }
    if (sip.templateEditor && typeof sip.templateEditor.init === 'function') {
        sip.templateEditor.init();
    }
    if (sip.imageUpload && typeof sip.imageUpload.init === 'function') {
        sip.imageUpload.init();
    }
    if (sip.eventHandlers && typeof sip.eventHandlers.init === 'function') {
        sip.eventHandlers.init();
    }
    if (sip.productHandlers && typeof sip.productHandlers.init === 'function') {
        sip.productHandlers.init();
    }
    // Any global event listeners can be added here
});
