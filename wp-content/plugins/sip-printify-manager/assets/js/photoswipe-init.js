// assets/js/photoswipe-init.js

import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5.3.0/dist/photoswipe-lightbox.esm.min.js';
import PhotoSwipe from 'https://unpkg.com/photoswipe@5.3.0/dist/photoswipe.esm.min.js';

document.addEventListener('DOMContentLoaded', function() {
    const lightbox = new PhotoSwipeLightbox({
        gallery: '#image-table-content',
        children: 'a',
        pswpModule: PhotoSwipe,
    });
    lightbox.init();
});
