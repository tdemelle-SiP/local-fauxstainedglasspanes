// image-actions.js

var sip = sip || {};

sip.imageActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
    }

    function attachEventListeners() {
        // Use event delegation for dynamically added elements
        $(document).on('dragover', '#image-upload-area', handleDragOver);
        $(document).on('dragleave', '#image-upload-area', handleDragLeave);
        $(document).on('drop', '#image-upload-area', handleDrop);
        $(document).on('click', '#select-images-button', triggerFileInput);
        $(document).on('change', '#image-file-input', handleFileInputChange);
        $(document).on('click', '#reload-images-button', reloadShopImages);
        $(document).on('submit', '.image-action-form', handleImageActionFormSubmit);
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

    function handleFileInputChange(e) {
        handleImageUpload(e.target.files);
    }

    function handleImageUpload(files) {
        var maxUploads = parseInt(sipAjax.max_file_uploads);
        var originalFileCount = files.length;

        if (files.length > maxUploads) {
            files = Array.from(files).slice(0, maxUploads);
            utilities.showToast(`We are uploading ${maxUploads} images, the maximum simultaneous uploads limit set in your server settings. This limit can be changed in your php.ini file.`, 7000, true);
        }

        var formData = new FormData();
        $.each(files, function(i, file) {
            formData.append('images[]', file);
        });

        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'image_action');
        formData.append('image_action', 'upload_images');
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('upload_images', formData);
    }

    function reloadShopImages(e) {
        if (e) e.preventDefault();
        var formData = new FormData($('#reload-shop-images-form')[0] || new FormData());
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'image_action');
        formData.append('image_action', 'reload_shop_images');
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('image_action', formData);
    }

    function handleImageActionFormSubmit(e) {
        e.preventDefault();
        var formData = new FormData(this);
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
        if (response.data.image_list_html) {
            $('#image-table-list').html(response.data.image_list_html).show();
            if (typeof sip.utilities.initImageSorting === 'function') {
                sip.utilities.initImageSorting();
            }
        }

        $('input[name="selected_images[]"], #select-all-images').prop('checked', false);
        $('#image-file-input').val('');
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('image_action', sip.imageActions.handleSuccessResponse);