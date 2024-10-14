<?php
// utilities.php

function sip_hide_admin_notices() {
    // Get the current admin screen
    $current_screen = get_current_screen();

    // Check if we are on the plugin's admin page
    if ($current_screen && $current_screen->id === 'sip-plugins_page_sip-printify-manager') {
        echo '<style>
            /* Hide all admin notices */
            .notice, .updated, .error, .success {
                display: none !important;
            }
        </style>';
    }
}

function sip_get_php_limits() {
    return array(
        'max_file_uploads' => ini_get('max_file_uploads'),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit')
    );
}