<?php
if ( ! class_exists( 'WP_Async_Request' ) ) {
    require_once( __DIR__ . '/class-wp-async-request.php' );
}

if ( ! class_exists( 'WP_Background_Process' ) ) {
    require_once( __DIR__ . '/class-wp-background-process.php' );
}

class SIP_Background_Process extends WP_Background_Process {
    protected $action = 'sip_bulk_product_creation';

    /**
     * Handle each task in the queue
     *
     * @param array $item The item to process.
     * @return bool|array False to remove the task from the queue.
     */
    protected function task( $item ) {
        // Log the start of the task
        sip_log_event( 'Starting bulk product creation task.', 'info' );

        // Extract data
        $template = isset( $item['template'] ) ? $item['template'] : array();
        $product_data = isset( $item['product_data'] ) ? $item['product_data'] : array();

        // Log the data being processed
        sip_log_event( 'Template data: ' . json_encode( $template ), 'info' );
        sip_log_event( 'Product data: ' . json_encode( $product_data ), 'info' );

        // Create the product
        $result = sip_create_printify_product( array(
            'template'     => $template,
            'product_data' => $product_data,
        ) );

        if ( $result ) {
            sip_log_event( "Product '{$product_data['title']}' created successfully.", 'info' );
        } else {
            sip_log_event( "Failed to create product '{$product_data['title']}'.", 'error' );
        }

        // Update progress
        $this->update_progress();

        // Return false to remove the task from the queue
        return false;
    }

    /**
     * Called when the queue is complete
     */
    protected function complete() {
        parent::complete();

        // Log the completion of the queue
        sip_log_event( 'Bulk product creation process completed.', 'info' );

        // Reset progress transients
        delete_transient( 'sip_bulk_creation_progress' );
        delete_transient( 'sip_bulk_creation_total' );
        delete_transient( 'sip_bulk_creation_completed' );
    }

    /**
     * Update the progress of bulk creation
     */
    private function update_progress() {
        $total = get_transient( 'sip_bulk_creation_total' );
        $completed = get_transient( 'sip_bulk_creation_completed' );

        if ( false === $total ) {
            $total = 1; // Avoid division by zero
            sip_log_event( 'Total tasks not set. Defaulting to 1.', 'warning' );
        }

        if ( false === $completed ) {
            $completed = 0;
            sip_log_event( 'Completed tasks not set. Defaulting to 0.', 'warning' );
        }

        $completed++;
        set_transient( 'sip_bulk_creation_completed', $completed, 60 * 60 );

        // Calculate progress percentage
        $progress = ( $completed / $total ) * 100;
        if ( $progress > 100 ) {
            $progress = 100;
        }

        set_transient( 'sip_bulk_creation_progress', $progress, 60 * 60 );

        sip_log_event( "Bulk creation progress: $progress%", 'info' );
    }
}

/**
 * Initialize the background process
 *
 * @return SIP_Background_Process
 */
function sip_init_background_process() {
    if ( ! class_exists( 'SIP_Background_Process' ) ) {
        require_once( __DIR__ . '/sip-background-process.php' );
    }
    return new SIP_Background_Process();
}
?>
