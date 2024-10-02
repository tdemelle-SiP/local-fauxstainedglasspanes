// imageUpload.js

/**
 * Handles image upload functionality, including drag-and-drop uploads and file selection
 */
var sip = sip || {};

sip.imageUpload = (function($) {
    function init() {
        /**
         * Handle drag over event on the image upload area.
         * Prevents default behavior and adds a visual indication.
         */
        $('#image-upload-area').on('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('dragging');
        });

        /**
         * Handle drag leave event on the image upload area.
         * Removes the visual indication.
         */
        $('#image-upload-area').on('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragging');
        });

        /**
         * Handle drop event on the image upload area.
         * Prevents default behavior and processes the dropped files.
         */
        $('#image-upload-area').on('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragging');

            var files = e.originalEvent.dataTransfer.files;
            handleImageUpload(files);
        });

        /**
         * Trigger the hidden file input when the "Select Images" button is clicked.
         */
        $('#select-images-button').on('click', function (e) {
            e.preventDefault();
            $('#image-file-input').trigger('click');
        });

        /**
         * Handle file selection from the file input.
         * Processes the selected files.
         */
        $('#image-file-input').on('change', function (e) {
            var files = e.target.files;
            handleImageUpload(files);
        });

        /**
         * Function to handle image uploads via drag-and-drop or file selection.
         * Sends the images to the server via AJAX for processing.
         *
         * @param {FileList} files - The list of files selected or dropped by the user.
         */
        function handleImageUpload(files) {
            var formData = new FormData();
            $.each(files, function (i, file) {
                formData.append('images[]', file);
            });
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'upload_images');
            formData.append('nonce', sipAjax.nonce);

            // Show spinner overlay
            $('#spinner-overlay').show();

            // Send the AJAX request to upload images
            sip.ajaxModule.handleAjaxAction('upload_images', formData, null, null);
        }
    }

    // Expose the init function
    return {
        init: init
    };
})(jQuery);
