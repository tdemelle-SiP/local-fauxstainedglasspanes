The initial primary goal for the SiP Printify Manager plugin for wordpress is to enable the ability to easily and efficiently bulk create new Printify products using the Printify API.  The high level workflow is as follows:
-User enters API Key - UX and Functionally Complete
-The Manager uses the API to return the user's Printify Store <GET /v1/shops.json> and its Products <GET /v1/shops/{shop_id}/products.json>. - UX and Functionally Complete
-The products are listed in the plugin interface. - UX and Functionally Complete
-There is an option to create templates from the retrieved files. - UX and Functionally Complete
-The files created are optimized to be used in the plugin's product creation functionality. - Needs to be developed. Details to follow.
-The templates can be used to bulk create large quantities of new products through the Printify API.

===================TEMPLATE CREATION FROM PRODUCT DATA==============================

The purpose of a template is to represent the data necessary to use the Printify Product Creation API call <POST /v1/shops/{shop_id}/products.json> to create a new product.  This template data format can be extrapolated from existing products.

As described above, any of the Products listed in the plugin can be selected to make a template.  

    The template creation process proceeds as follows:
        -When the Create Template action is executed on a selected source product, a python script is run on the selected source product .json that strips out all the data that is not necessary for new product creation.  This includes:
            "id": 
            "options": [{}]
            "images": [{}]
            "created_at":
            "updated_at":
            "visible":
            "is_locked":
            "external": {}
            "user_id":
            "shop_id":
            "print_details": []
            "sales_channel_properties": []
            "is_printify_express_eligible":
            "is_printify_express_enabled":
            "is_economy_shipping_eligible":
            "is_economy_shipping_enabled":
        -Certain keys are stripped of content but left intact to hold data for the template:
            "tags":
        -Data specified in the product will be converted into variables that can be replaced.  However many images there are will be captured as variables "image_01", "image_02", etc.  Text will be similarly captured as "text_01", "text_02".  These placeholder names will be saved in the appropriate places throughout the template so they can be easily swapped with new data later in the new product creation process as described below.
        -This template will be permanently stored for the user to use or remove at their discretion.

=====================PRODUCT CREATION USING TEMPLATES================================
When the user selects a template and executes the create product requests action, the template stays selected and a table appears that holds fields for data entry for the new product/s.
The data the User will provide to inject into the template is simply:
    - Title
    - Tags
    - url of image to swap in for main design
    - Text to swap in for main text.
Headers in the first row of the table should be based on whatever printable image and/or text variables are present in the  Title | Tags | Image_01 url | Image_02 url | etc | Text_01 | Text_02 | etc
Above the table there should be a button to add a new row in which another set of data can be added for another new product based on the same template.
Tens or even hundreds of new product data can be queued up.
If the user selects another template and executes the create product requests, the table is appended with any data fields that are not already represented in the existing image and text data.  If the data fields are all the same, the data already listed will map to the second template as well.
With the various templates to use selected in the templates list and the data table populated with rows representing the new productes to make from the templates, the user can then execute CREATE NEW PRODUCTS
The plugin will then cycle through all the rows for each template, generate .json files and make the API calls to Printify to create each new product specified.

============================LINKS/DOCUMENTATION REFERENCE==========================

REFERENCE GOOGLE SHEET
https://docs.google.com/spreadsheets/d/1twFAEjEgDgCfhI_qZlTRBLnUTCt0DVMDfW6EFPHXj3Y/edit?usp=sharing

FSGP PoD PRODUCT IMAGES
https://public.fauxstainedglasspanes.com/public_files/images/pod/

TEMPLATE REFERENCE WITH TITLE/DESCRIPTION/VARIANT DETAILS
D:\My Drive\FSGP\fsgp-docs\printify_templates

FSGP PRODUCTS ON PRINTIFY
https://printify.com/app/store/products/1

API DOCUMENTATION
https://developers.printify.com/#overview

==============================PLUGIN FOLDER STRUCTTURE=============================

/wp-content/plugins/
	├── sip-plugins-core/
    └── sip-printify-manager/
        ├── assets/
        │   ├── css/
        │   │   └── sip-printify-manager.css
        │   └── js/
        │       └── sip-ajax.js
        ├── includes/
        │   ├── shop-functions.php
        │   ├── product-functions.php
        │   └── template-functions.php
        ├── views/
        │   └── admin-page.php
        ├── sip-printify-manager.php
        └── README.md