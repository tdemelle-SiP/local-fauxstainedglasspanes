<?php
// Set the error log file path
ini_set('error_log', 'C:\\Users\\tdeme\\Local Sites\\fauxstainedglasspanes\\logs\\php\\test_error.log');

// Trigger an error for testing
error_log("This is a test error log.");
trigger_error("This is a test error.", E_USER_NOTICE);
?>
