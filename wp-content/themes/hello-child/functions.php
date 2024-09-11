<?php
// /hello-child/functions.php
function hello_child_enqueue_styles() {
    // Enqueue parent theme styles if necessary
    wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
}
add_action('wp_enqueue_scripts', 'hello_child_enqueue_styles');

function hello_child_sidebar_registration() {
    register_sidebar(array(
        'id'            => 'custom_sidebar',
        'name'          => __('Custom Sidebar', 'hello-child'),
        'description'   => __('A custom sidebar for hello child theme', 'hello-child'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ));
}
add_action('widgets_init', 'hello_child_sidebar_registration');

// Enable WordPress debugging
//if (!defined('WP_DEBUG')) {
//    define('WP_DEBUG', true);
//}
//if (!defined('WP_DEBUG_LOG')) {
//    define('WP_DEBUG_LOG', true);
//}
//if (!defined('WP_DEBUG_DISPLAY')) {
//    define('WP_DEBUG_DISPLAY', false); // Hide errors from displaying on the frontend
//}

// Function to enqueue the custom script
//function facetwp_custom_scripts() {
    // Ensure the FacetWP function exists before enqueueing the script
//    if (function_exists('facetwp_display')) {
//        wp_enqueue_script('facetwp-custom', get_stylesheet_directory_uri() . '/assets/js/facetwp-custom.js', array('jquery'), null, true);
//    }
//}

// Hook the function to 'wp_enqueue_scripts' with a higher priority to ensure FacetWP is loaded
//add_action('wp_enqueue_scripts', 'facetwp_custom_scripts', 20);

?>