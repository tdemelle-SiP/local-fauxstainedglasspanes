// image-actions.js

var sip = sip || {};

sip.imageActions = (function($, ajax, utilities) {
    function init() {
        attachDragAndDropEvents();
        attachFileInputEvents();
        attachReloadImagesEvent();
        attachImageActionFormSubmit();
    }

    function attachDragAndDropEvents() {
        $('#image-upload-area').on({
            dragover: function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).addClass('dragging');
            },
            dragleave: function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('dragging');
            },
            drop: function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).removeClass('dragging');
                handleImageUpload(e.originalEvent.dataTransfer.files);
            }
        });
    }

    function attachFileInputEvents() {
        $('#select-images-button').on('click', function(e) {
            e.preventDefault();
            $('#image-file-input').trigger('click');
        });

        $('#image-file-input').on('change', function(e) {
            handleImageUpload(e.target.files);
        });
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
        formData.append('action_type', 'upload_images');
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('upload_images', formData);
    }

    function attachReloadImagesEvent() {
        $(document).on('click', '#reload-images-button', function(e) {
            e.preventDefault();
            reloadShopImages();
        });
    }

    function reloadShopImages() {
        var formData = new FormData($('#reload-shop-images-form')[0] || new FormData());
        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'image_action');
        formData.append('image_action', 'reload_shop_images');
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('image_action', formData);
    }

    function attachImageActionFormSubmit() {
        $('.image-action-form').on('submit', function(e) {
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
        });
    }

    function handleSuccessResponse(response) {
        if (response.data.image_list_html) {
            $('#image-table-list').html(response.data.image_list_html).show();
            if (typeof sip.utilities.initImageSorting === 'function') {
                sip.utilities.initImageSorting();
            }
        }

        $('input[name="selected_images[]"], #select-all-images').prop('checked', false);
        
        if (response.data.action === 'upload_images') {
            $('#image-file-input').val('');
        }
        
        attachReloadImagesEvent();
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse
    };
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('image_action', sip.imageActions.handleSuccessResponse);

jQuery(document).ready(sip.imageActions.init);