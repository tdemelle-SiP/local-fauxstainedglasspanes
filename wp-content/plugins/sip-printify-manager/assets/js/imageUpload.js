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
            var maxUploads = parseInt(sipAjax.max_file_uploads);
            if (files.length > maxUploads) {
                alert('Number of Simultaneous Uploads is limited to ' + maxUploads + ' by your server settings. This limit can be changed in your php.ini file.');
                files = Array.from(files).slice(0, maxUploads);
            }

            var formData = new FormData();
            $.each(files, function (i, file) {
                formData.append('images[]', file);
                console.log('Appending file:', file.name);
            });
            
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'upload_images');
            formData.append('nonce', sipAjax.nonce);

            // Show spinner overlay
            $('#spinner-overlay').show();

            // Send the AJAX request to upload images
            $.ajax({
                url: sipAjax.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        // Update the image list with the new HTML
                        $('#image-table-list').html(response.data.image_list_html);
                        alert(response.data.message);
                    } else {
                        alert('Failed to upload images. Please try again.');
                    }
                },
                error: function() {
                    alert('An error occurred while uploading the images.');
                },
                complete: function() {
                    // Hide spinner after processing
                    $('#spinner-overlay').hide();
                }
            });
        }

        function attachReloadImagesEvent() {
            $(document).on('click', '#reload-images-button', function(e) {
                e.preventDefault();
                reloadShopImages();
            });
        }

        function reloadShopImages() {
            // Show spinner overlay
            $('#spinner-overlay').show();

            var formData;
            if ($('#reload-shop-images-form').length) {
                formData = new FormData($('#reload-shop-images-form')[0]);
            } else {
                formData = new FormData();
                formData.append('action', 'sip_handle_ajax_request');
                formData.append('action_type', 'image_action');
                formData.append('image_action', 'reload_shop_images');
                formData.append('nonce', sipAjax.nonce);
            }

            $.ajax({
                url: sipAjax.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        $('#image-table-list').html(response.data.image_list_html);
                        attachReloadImagesEvent();  // Reattach event listener after refresh
                    } else {
                        console.error('Failed to reload images:', response.data.message);
                    }
                },
                error: function() {
                    console.error('An error occurred while reloading the images.');
                },
                complete: function() {
                    // Hide spinner overlay after processing
                    $('#spinner-overlay').hide();
                }
            });

        }
    
        // Attach event to remove selected images button
        $('.image-action-form').on('submit', function(e) {
            e.preventDefault();
            var formData = new FormData(this);
            var action = $('#image_action').val();

            // Ensure we're adding selected images to the formData
            $('input[name="selected_images[]"]:checked').each(function() {
                formData.append('selected_images[]', $(this).val());
            });
            formData.append('action', 'sip_handle_ajax_request');
            formData.append('action_type', 'image_action');
            formData.append('image_action', action);
            formData.append('nonce', sipAjax.nonce);


            // Show spinner while processing
            $('#spinner-overlay').show();

            $.ajax({
                url: sipAjax.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,                
                success: function(response) {
                    if (response.success) {
                        $('#image-table-list').html(response.data.image_list_html);
                        attachReloadImagesEvent();
                    } else {
                        console.error('Action failed:', response.data.message);
                    }
                },
                error: function() {
                    console.error('An error occurred while processing the action.');
                },
                complete: function() {
                    // Hide spinner overlay after processing
                    $('#spinner-overlay').hide();
                }
            });
        });
        // Attach the event listener initially
        attachReloadImagesEvent();
    }

    // Expose the init function
    return {
        init: init
    };
})(jQuery);