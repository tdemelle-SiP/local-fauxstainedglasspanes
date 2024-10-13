var sip = sip || {};
var isUploading = false;

sip.imageActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
        
    }

    function attachEventListeners() {
        // Use event delegation for dynamically added elements
        $(document).on('dragover', '#image-upload-area', handleDragOver);
        $(document).on('dragleave', '#image-upload-area', handleDragLeave);
        $(document).on('drop', '#image-upload-area', handleDrop);
        
        $('#select-images-button').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#image-file-input').trigger('click');
        });

        // Reload images button event
        $(document).off('click', '#reload-images-button').on('click', '#reload-images-button', function(e) {
            e.preventDefault();
            e.stopPropagation();
            reloadShopImages();
        });
    
        // Image action form submit event
        $(document).off('submit', '.image-action-form').on('submit', '.image-action-form', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleImageActionFormSubmit(e);
        });

        // File input change event
        $('#image-file-input').off('change').on('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var files = e.target.files;
            if (files.length > 0) {
                handleImageUpload(files);
                $(this).val(''); // Reset the file input
            }
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('dragging');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');
        handleImageUpload(e.originalEvent.dataTransfer.files);
    }

    function triggerFileInput(e) {
        e.preventDefault();
        $('#image-file-input').trigger('click');
    }

    function handleImageUpload(files) {
        if (isUploading) {
            console.log('Upload already in progress. Please wait.');
            return;
        }
        isUploading = true;

        var maxUploads = parseInt(sipAjax.max_file_uploads);
        var originalFileCount = files.length;

        if (files.length > maxUploads) {
            files = Array.from(files).slice(0, maxUploads);
            utilities.showToast(`Uploading ${maxUploads} images, the maximum simultaneous uploads allowed by your server settings. This limit can be changed in your php.ini file.`, 7000, true);
        }

        var formData = new FormData();
        $.each(files, function(i, file) {
            formData.append('images[]', file);
        });

        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'image_action');
        formData.append('image_action', 'upload_images');
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('upload_images', formData, function() {
            isUploading = false;
        });            
    }

    function reloadShopImages() {
        var formData = utilities.createFormData('image_action', 'reload_shop_images');
        sip.ajax.handleAjaxAction('image_action', formData);
    }

    function handleImageActionFormSubmit(e) {
        e.preventDefault();
        var formData = new FormData(e.target);
        var action = $('#image_action').val();
    
        $('input[name="selected_images[]"]:checked').each(function() {
            formData.append('selected_images[]', $(this).val());
        });
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'image_action');
        formData.append('image_action', action);
        formData.append('nonce', sipAjax.nonce);
    
        sip.ajax.handleAjaxAction('image_action', formData);
    }

    function handleSuccessResponse(response) {
        console.log('Handling success response:', response);
    
        if (response.data.image_list_html) {
            $('#image-table-list').html(response.data.image_list_html).show();
            console.log('Image list HTML updated');
        } else if (response.data.images) {
            // If we receive image data instead of HTML, we need to update the table manually
            updateImageTable(response.data.images);
            console.log('Image table updated manually');
        }
    
        if (typeof sip.utilities.initImageSorting === 'function') {
            sip.utilities.initImageSorting();
            console.log('Image sorting reinitialized');
        }
    
        $('input[name="selected_images[]"], #select-all-images').prop('checked', false);
        $('#image-file-input').val('');
    
        // Reset isUploading flag if this was an upload action
        if (response.data.action === 'upload_images') {
            isUploading = false;
        }
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);


sip.ajax.registerSuccessHandler('image_action', sip.imageActions.handleSuccessResponse);