<?php
// Trigger a warning
echo $undefined_variable; // This should generate a warning
$upload_dir = wp_upload_dir();
error_log(print_r($upload_dir, true));
?>
