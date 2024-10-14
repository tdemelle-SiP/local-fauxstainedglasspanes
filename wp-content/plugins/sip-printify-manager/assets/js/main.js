// main.js

var sip = sip || {};

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', message, 'at', source, 'line', lineno, ':', error);
    return false;
};

(function($) {
    $(document).ready(function() {
        if (sip.init && typeof sip.init.initializeAllModules === 'function') {
            sip.init.initializeAllModules();
        } else {
            console.error('sip.init.initializeAllModules is not available or not a function');
        }
    });
})(jQuery);