var sip = sip || {};
var isUploading = false;

sip.imageActions = (function($, ajax, utilities) {
    function init() {
        attachEventListeners();
        restoreImageHighlights();
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

    function initPhotoSwipe() {
        if (typeof PhotoSwipeLightbox === 'undefined') {
            console.error('PhotoSwipeLightbox is not defined. Make sure its properly loaded.');
            return;
        }
    
        const lightbox = new PhotoSwipeLightbox({
            gallery: '#image-table-content',
            children: 'a',
            pswpModule: PhotoSwipe
        });
        lightbox.init();
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

        var phpLimits = sipAjax.php_limits;
        var maxUploads = parseInt(phpLimits.max_file_uploads);
        var maxFilesize = sip.utilities.convertToBytes(phpLimits.upload_max_filesize);
        var originalFileCount = files.length;
    
        if (files.length > maxUploads) {
            files = Array.from(files).slice(0, maxUploads);
            sip.utilities.showToast(`Uploading ${maxUploads} images, the maximum simultaneous uploads allowed by your server settings. This limit can be changed in your php.ini file.`, 7000, true);
        }
    
        var formData = new FormData();
        $.each(files, function(i, file) {
            if (file.size > maxFilesize) {
                sip.utilities.showToast(`File "${file.name}" exceeds the maximum upload size of ${phpLimits.upload_max_filesize}. Skipping this file. This limit can be changed in your php.ini file.`, 5000, true);
            } else {
                formData.append('images[]', file);
            }
        });

        formData.append('action', 'sip_handle_ajax_request');
        formData.append('action_type', 'image_action');
        formData.append('image_action', 'upload_images');
        formData.append('nonce', sipAjax.nonce);

        sip.ajax.handleAjaxAction('image_action', formData, function() {
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
            
            // Get loaded template data
            const loadedTemplate = JSON.parse(localStorage.getItem('sip_loaded_template') || '{}');
            if (loadedTemplate) {
                updateImageRowHighlights(loadedTemplate);
            }
            
            console.log('Image list HTML updated');
            console.log('***hidespinner called. Images loaded successfully');
            sip.utilities.hideSpinner();
        } else if (response.data.images) {
            updateImageTable(response.data.images);
            console.log('Image table updated manually');
            console.log('***hidespinner called. Images loaded successfully');
            sip.utilities.hideSpinner();
        }
    
        initPhotoSwipe();
    
        if (typeof sip.utilities.initImageSorting === 'function') {
            sip.utilities.initImageSorting();
            console.log('Image sorting reinitialized');
        }
    
        $('input[name="selected_images[]"], #select-all-images').prop('checked', false);
        $('#image-file-input').val('');
    
        if (response.data.action === 'upload_images') {
            isUploading = false;
        }
    }

    // Add new function to handle image row highlighting
    function updateImageRowHighlights(templateData) {
        // Clear existing highlights
        $('#image-table-content tr').removeClass('created wip archived');
        
        // Get all images used in template
        const templateImages = getTemplateImages(templateData);
        
        // Get creation table row types and their images
        const creationTableRows = $('#creation-table tbody tr');
        const rowTypeImages = {
            'created': [],
            'wip': [],
            'archived': []
        };
        
        creationTableRows.each(function() {
            const rowType = $(this).attr('data-row-type');
            if (rowType && rowTypeImages[rowType]) {
                const images = $(this).find('.image-cell img').map(function() {
                    return $(this).attr('data-image-id');
                }).get();
                rowTypeImages[rowType].push(...images);
            }
        });
        
        // Apply highlights to image table rows
        $('#image-table-content tr').each(function() {
            const imageId = $(this).find('input[type="checkbox"]').val();
            
            if (templateImages.includes(imageId)) {
                $(this).addClass('created');
            } else if (rowTypeImages.created.includes(imageId)) {
                $(this).addClass('created');
            } else if (rowTypeImages.wip.includes(imageId)) {
                $(this).addClass('wip');
            } else if (rowTypeImages.archived.includes(imageId)) {
                $(this).addClass('archived');
            }
        });
    
        // Store the highlight state
        localStorage.setItem('sip_image_highlights', JSON.stringify({
            templateImages,
            rowTypeImages
        }));
    }

    function restoreImageHighlights() {
        const highlightData = localStorage.getItem('sip_image_highlights');
        if (highlightData) {
            const { templateImages, rowTypeImages } = JSON.parse(highlightData);
            $('#image-table-content tr').each(function() {
                const imageId = $(this).find('input[type="checkbox"]').val();
                if (templateImages.includes(imageId)) {
                    $(this).addClass('created');
                } else if (rowTypeImages.created.includes(imageId)) {
                    $(this).addClass('created');
                } else if (rowTypeImages.wip.includes(imageId)) {
                    $(this).addClass('wip');
                } else if (rowTypeImages.archived.includes(imageId)) {
                    $(this).addClass('archived');
                }
            });
        }
    }

    // Helper function to extract all image IDs from template data
    function getTemplateImages(templateData) {
        const imageIds = [];
        if (templateData.print_areas) {
            templateData.print_areas.forEach(area => {
                if (area.placeholders) {
                    area.placeholders.forEach(placeholder => {
                        if (placeholder.images) {
                            placeholder.images.forEach(image => {
                                if (image.id) {
                                    imageIds.push(image.id);
                                }
                            });
                        }
                    });
                }
            });
        }
        return imageIds;
    }

    return {
        init: init,
        handleSuccessResponse: handleSuccessResponse,
        updateImageRowHighlights: updateImageRowHighlights,
        getTemplateImages: getTemplateImages,
        updateImageRowHighlights: updateImageRowHighlights
    };
    
})(jQuery, sip.ajax, sip.utilities);

sip.ajax.registerSuccessHandler('image_action', sip.imageActions.handleSuccessResponse);