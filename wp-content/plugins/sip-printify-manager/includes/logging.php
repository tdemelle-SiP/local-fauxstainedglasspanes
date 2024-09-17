<?php
/**
 * Logging Utility for SiP Printify Manager
 */

/**
 * Logs events to a custom log file.
 *
 * @param string $message The message to log.
 * @param string $level   The severity level (e.g., info, warning, error).
 */
function sip_log_event( $message, $level = 'info' ) {
    $upload_dir = wp_upload_dir();
    $log_file = trailingslashit( $upload_dir['basedir'] ) . 'sip-printify-manager.log';

    // Ensure the uploads directory exists
    if ( ! file_exists( dirname( $log_file ) ) ) {
        wp_mkdir_p( dirname( $log_file ) );
    }

    $time_stamp = current_time( 'mysql' );
    $formatted_message = "[$time_stamp] [$level] $message" . PHP_EOL;
    file_put_contents( $log_file, $formatted_message, FILE_APPEND );
}

/**
 * Rotate the log file if it exceeds a certain size (e.g., 5MB)
 */
function sip_rotate_log_file() {
    $upload_dir = wp_upload_dir();
    $log_file = trailingslashit( $upload_dir['basedir'] ) . 'sip-printify-manager.log';
    $max_size = 5 * 1024 * 1024; // 5MB

    if ( file_exists( $log_file ) && filesize( $log_file ) >= $max_size ) {
        $archive_file = trailingslashit( $upload_dir['basedir'] ) . 'sip-printify-manager-' . date( 'Y-m-d-H-i-s' ) . '.log';
        rename( $log_file, $archive_file );
        sip_log_event( 'Log file rotated.', 'info' );
    }
}
add_action( 'admin_init', 'sip_rotate_log_file' );
?>
