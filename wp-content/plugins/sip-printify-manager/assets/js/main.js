// main.js

/**
 * Entry point for the SIP Printify Manager plugin
 * Initializes the plugin and imports other modules
 */

var sip = sip || {};

jQuery(document).ready(function($) {
    // Initialize modules
    sip.spinner.init();
    sip.ajaxModule.init();
    sip.productCreation.init();
    sip.templateEditor.init();
    sip.imageUpload.init();
    sip.eventHandlers.init();
    // Any global event listeners can be added here
});
