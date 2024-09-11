<?php
/**
 * Plugin Name: Custom Hooks
 * Plugin URI: https://facetwp.com/
 * Description: A container for custom hooks
 * Version: 1.0
 * Author: FacetWP, LLC
 *
 * @category Plugin
 * @package  Custom_Hooks
 * @author Rodolfo Melogli
 * @license GPL-2.0-or-later
 * @link https://businessbloomer.com/club/
 */

/*
 * You can add custom data to the Woocommerce session by using the following function:
 * WC()->session->set( 'cart_id', 'some-example-data' );
 * 
 * Returns the contents of the cart in an array without the 'data' element.
 * public get_cart_for_session() : array<string|int, mixed>
 * Return values
 * array<string|int, mixed> — contents of the cart
 * https://woocommerce.github.io/code-reference/classes/WC-Cart-Session.html
 * /

/* remove rogue item in empty cart */

function force_empty_cart() {
    if ( is_cart() || is_checkout() ) {
        // Delay action to ensure other scripts have finished modifying the cart
        add_action( 'wp_footer', function() {
            if ( WC()->cart->get_cart_contents_count() == 0 ) {
                WC()->cart->empty_cart();
            }
        }, 9999 );
    }
}
add_action( 'template_redirect', 'force_empty_cart' );

function log_cart_status() {
    if ( is_cart() || is_checkout() ) {
        $cart_count = WC()->cart->get_cart_contents_count();
        error_log( 'Cart count on load: ' . $cart_count );
        if ( $cart_count == 0 ) {
            WC()->cart->empty_cart();
            error_log( 'Cart was empty and has been cleared.' );
        }
    }
}
add_action( 'template_redirect', 'log_cart_status' );

/* Variation table master */

// Function to get default data
function get_default_data($product_id) {
	$product = wc_get_product($product_id);
	$variations = $product->get_available_variations();
	$print_styles = [];
	$default_data = [];

	foreach ($variations as $variation) {
		$print_style = isset($variation['attributes']['attribute_pa_print-style']) ? $variation['attributes']['attribute_pa_print-style'] : '';
		if (!in_array($print_style, $print_styles)) {
			$print_styles[] = $print_style;
		}
	}

	foreach ($print_styles as $print_style) {
		$default_data[] = [$print_style];
	}

	return $default_data;
}


function wc_master_variations_table($atts = []) {
	
    $atts = shortcode_atts([
        'product_id' => 0,
    ], $atts, 'wc_master_variations_table');

    $product_id = $atts['product_id'] ? esc_attr($atts['product_id']) : get_the_ID();
    $product = wc_get_product($product_id);

    if (!is_a($product, 'WC_Product') || !$product->is_type('variable')) {
        return 'This product is not a variable product.';
    }

    $variation_attributes = $product->get_variation_attributes();
    $variations = $product->get_available_variations();

    if (empty($variations)) {
        return 'No variations found for this variable product.';
    }

	// Get the term names for the attribute slugs
    $attribute_terms = get_terms([
        'taxonomy' => 'pa_print-style',
        'hide_empty' => false,
    ]);
    $attribute_names = [];
    foreach ($attribute_terms as $term) {
        $attribute_names[$term->slug] = $term->name;
    }
	
	$default_data = get_default_data($product_id);

	// Start output table with default rows
	$output = '<table id="wc-variations-table-' . $product_id . '" class="wc-variations-table" style="cursor: pointer;" data-parent-product-id="' . $product_id . '">';
	$output .= '<thead><tr>';

	$first_attribute = key($variation_attributes);
	$output .= '<th><span id="clear-icon-' . $product_id . '" class="fas fa-undo-alt clear-icon" aria-hidden="true" style="display:none;"></span>';
	$output .= '<span>' . wc_attribute_label($first_attribute) . '</span> <span class="sort-arrow"></span></th>';

	$output .= '</tr></thead><tbody>';

	// Default rows
	foreach ($default_data as $row) {
		$output .= '<tr class="default-row">';
		foreach ($row as $cell) {
			$display_value = isset($attribute_names[$cell]) ? $attribute_names[$cell] : $cell;
			$output .= '<td data-slug="' . esc_attr($cell) . '">' . esc_html($display_value) . '</td>';
		}
		$output .= '</tr>';
	}



	// Existing variation rows
	foreach ($variations as $variation) {
		$attributes = $variation['attributes'];
		$variation_obj = wc_get_product($variation['variation_id']);
		$price = '$' . $variation_obj->get_price();

		$output .= '<tr data-variation_id="' . $variation['variation_id'] . '" data-attributes=\'' . json_encode($attributes) . '\' style="display: none;">';
		
		
		foreach ($variation_attributes as $attribute_name => $options) {
			$attribute_value = isset($attributes['attribute_' . $attribute_name]) ? $attributes['attribute_' . $attribute_name] : '';
			$display_value = isset($attribute_names[$attribute_value]) ? $attribute_names[$attribute_value] : $attribute_value;
			$output .= '<td data-slug="' . esc_attr($attribute_value) . '">' . esc_html($display_value) . '</td>';
		}


		$output .= "<td>{$price}</td>";
		$output .= '</tr>';
	}
	$output .= '</tbody></table>';

    global $product;
    if (!$product) {
        $product_id = get_the_ID();
        $product = wc_get_product($product_id);
    }
    $parent_product_name = $product->get_name();


	$output .= '<script>
		document.addEventListener("DOMContentLoaded", function() {
			var productId = "' . $product_id . '";
			var product = ' . json_encode(wc_get_product($product_id)) . ';
			var table = document.getElementById("wc-variations-table-" + productId);
			var variationForm = document.querySelector(".variations_form[data-product_id=\'" + productId + "\']");
			var variationElement = document.querySelector(".woocommerce-variation.single_variation");
			var addToCartButton = document.querySelector(".woocommerce-variation-add-to-cart.variations_button");
			var clearIcon = document.getElementById("clear-icon-' . $product_id . '");

			var resetButton = document.querySelector(".reset_variations");
			if (resetButton) {
				resetButton.addEventListener("click", function() {
					resetTable();
				});
			}

			window.customAjax = {
				ajaxurl: "' . admin_url('admin-ajax.php') . '"
			};

			function showDefaultRows() {
				const defaultRows = document.querySelectorAll(".wc-variations-table .default-row");
				defaultRows.forEach(row => {
					row.style.display = "";
					row.style.opacity = "1";
				});
			}

			function isTableInDefaultState() {
				const defaultRows = document.querySelectorAll(".wc-variations-table .default-row");
				const isDefaultState = Array.from(defaultRows).some(row => row.style.display !== "none");
				console.log("isTableInDefaultState called. Default state:", isDefaultState);
				return isDefaultState;
			}

			function addHeaders() {
				var thead = table.querySelector("thead");
				if (thead) {
					var headers = thead.querySelector("tr");
					if (headers && !headers.querySelector(".size-header")) {
						headers.insertAdjacentHTML("beforeend", "<th class=\"size-header\"><span> Size </span><span class=\"sort-arrow\"></span></th>");
					}
					if (headers && !headers.querySelector(".price-header")) {
						headers.insertAdjacentHTML("beforeend", "<th class=\"price-header\"><span> Price </span><span class=\"sort-arrow\"></span></th>");
					}
				}       
				table.addEventListener("click", function(event) {
					if (event.target.closest(".size-header")) {
						sortTable("size");
					} else if (event.target.closest(".price-header")) {
						sortTable("price");
					}
				});
			}

			function removeHeaders() {
				var thead = table.querySelector("thead");
				if (thead) {
					var sizeHeader = thead.querySelector(".size-header");
					var priceHeader = thead.querySelector(".price-header");
					if (sizeHeader) {
						sizeHeader.remove();
					}
					if (priceHeader) {
						priceHeader.remove();
					}
				}
			}

			var variationsTable = document.querySelector("table.variations");
			var wcVariationsTable = document.getElementById("wc-variations-table-" + productId);

			if (variationsTable && wcVariationsTable) {
				variationsTable.parentNode.insertBefore(wcVariationsTable, variationsTable.nextSibling);
			} else {
				console.error("Required elements not found.");
			}

			const defaultRows = document.querySelectorAll(".wc-variations-table .default-row");

			defaultRows.forEach(row => {
				row.addEventListener("click", function() {
					const variationRows = document.querySelectorAll(".wc-variations-table tr[data-variation_id]");
					variationRows.forEach(vRow => vRow.style.display = "none");

					defaultRows.forEach(dRow => dRow.classList.remove("selected"));
					this.classList.add("selected");

					const printStyle = this.cells[0].innerText;
					updateDropdown(printStyle);
					displayVariantsForPrintStyle(printStyle);
					console.log ("displayVariantsForPrintStyle has run");
					clearDimming();
					console.log ("clearDimming has run");
					addHeaders();
				});
			});

			function updateDropdown(printStyle) {
				var printStyleDropdown = dropdowns["pa_print-style"];
				if (printStyleDropdown) {
					printStyleDropdown.value = printStyle;
					jQuery(printStyleDropdown).trigger("change");
					filterRowsBySelection();
					console.log ("filter rows by selection has run");
					var allRows = table.getElementsByTagName("tr");
					console.log("Total rows after filter:", allRows.length);
					var visibleRows = table.querySelectorAll("tbody tr:not([style*=\'display: none\'])");
					console.log("Visible rows after filtert:", visibleRows.length);
					highlightMatchingRow();
				}
			}

			function generateSlug(name) {
				return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
			}

			function displayVariantsForPrintStyle(printStyle) {
				const slug = generateSlug(printStyle);
				const variants = Array.from(table.querySelectorAll("tr[data-attributes]")).filter(row => {
					const attributes = JSON.parse(row.getAttribute("data-attributes"));
					return attributes["attribute_pa_print-style"] === slug;
				});

				if (variants.length) {
					variants.forEach(variant => {
						variant.style.display = "";
					});
					filterRowsBySelection();
					highlightMatchingRow();
				} else {
					console.error("No variants found for print style:", printStyle);
				}
			}

			defaultRows.forEach(row => {
				row.addEventListener("click", function() {
					const printStyleSlug = this.querySelector("td").getAttribute("data-slug");
					updateDropdown(printStyleSlug);
					displayVariantsForPrintStyle(printStyleSlug);
				});
			});

			var parentProductName = "' . esc_js($parent_product_name) . '";
			var addToCartButton = document.querySelector(".variations_form[data-product_id=\'' . $product_id . '\'] .single_add_to_cart_button");
			var quantityInput = document.querySelector(".quantity .input-text.qty");
			var variationDescription = document.querySelector(".woocommerce-variation.single_variation .woocommerce-variation-description");

			var dropdowns = {};
			var attributes = ' . json_encode(array_keys($variation_attributes)) . ';
			var attributeNames = ' . json_encode($attribute_names) . ';           
			var variations = ' . json_encode($variations) . ';

			attributes.forEach(function(attribute) {
				var selector = ".variations_form[data-product_id=\'" + ' . $product_id . ' + "\'] select[name=\'attribute_" + attribute + "\']";
				dropdowns[attribute] = document.querySelector(selector);

				if (dropdowns[attribute]) {
					dropdowns[attribute].addEventListener("change", function() {
						console.log("Dropdown for attribute " + attribute + " changed. New value: " + dropdowns[attribute].value);
						jQuery(variationForm).trigger("woocommerce_variation_has_changed");
					});
				}
			});

			function populatePrintStyleDropdown() {
				console.log("populatePrintStyleDropdown called");
				var printStyleDropdown = dropdowns["pa_print-style"];
				if (printStyleDropdown) {
					printStyleDropdown.innerHTML = "";
					var option = document.createElement("option");
					option.value = "";
					option.text = "Select Style";
					printStyleDropdown.appendChild(option);

					var printStyles = new Set();
					variations.forEach(function(variation) {
						var variationAttributes = variation.attributes;
						var printStyle = variationAttributes["attribute_pa_print-style"];
						if (printStyle) {
							printStyles.add(printStyle);
						}
					});

					printStyles.forEach(function(printStyle) {
						var option = document.createElement("option");
						option.value = printStyle;
						var variationName = attributeNames[printStyle] || printStyle;
						option.text = variationName;
						printStyleDropdown.appendChild(option);
					});
				}
			}

			function activateAddToCartButton() {
				if (addToCartButton) {
					addToCartButton.classList.remove("disabled");
					addToCartButton.disabled = false;
				}
			}

			function disableAddToCartButton() {
				if (addToCartButton) {
					addToCartButton.classList.add("disabled");
					addToCartButton.disabled = true;
				}
			}

			function clearDimming() {
				var allRows = table.getElementsByTagName("tr");
				console.log("Total rows:", allRows.length);

				var visibleRows = table.querySelectorAll("tbody tr:not([style*=\'display: none\'])");
				console.log("Visible rows count:", visibleRows.length);

				visibleRows.forEach(function(row) {
					console.log("Before clearing dimming for row:", row);
					row.classList.remove("selected");
					row.style.opacity = "1";
					console.log("Cleared dimming for row:", row);
				});
			}

			function dimTable() {
				var rows = table.getElementsByTagName("tr");
				for (var i = 1; i < rows.length; i++) {
					rows[i].style.opacity = "0.4";
					console.log ("dimtable is making the opacity 0.4");
				}
			}

			function updateDimming(selectedRow) {
				var rows = table.getElementsByTagName("tr");
				for (var i = 1; i < rows.length; i++) {
					if (rows[i] === selectedRow) {
						rows[i].classList.add("selected");
						rows[i].style.opacity = "1";
					} else {
						rows[i].classList.remove("selected");
						rows[i].style.opacity = "0.4";
						console.log ("update dimming is making the opacity 0.4");
					}
				}
			}

			let sortDirections = Array.from({ length: table.querySelectorAll("th").length }, () => "asc");
			var lastSortedColumn = -1;
			function sortTable(columnIndex, initialSort = false) {
				var rows = Array.from(table.querySelectorAll("tbody tr"));
				var direction = table.querySelectorAll("th")[columnIndex].classList.contains("sort-asc") ? "desc" : "asc";

				table.querySelectorAll("th").forEach(function(header) {
					header.classList.remove("sort-asc", "sort-desc");
				});

				table.querySelectorAll("th")[columnIndex].classList.add("sort-" + direction);

				rows.sort(function(a, b) {
					var x = a.cells[columnIndex].innerText.toLowerCase();
					var y = b.cells[columnIndex].innerText.toLowerCase();

					if (columnIndex === rows[0].cells.length - 1) {
						x = parseFloat(x.replace(/[^\d.-]/g, ""));
						y = parseFloat(y.replace(/[^\d.-]/g, ""));
					}

					if (direction === "asc") {
						return x > y ? 1 : -1;
					} else {
						return x < y ? -1 : 1;
					}
				});

				rows.forEach(function(row) {
					table.querySelector("tbody").appendChild(row);
				});

				sortDirections[columnIndex] = direction;
				lastSortedColumn = columnIndex;
			}

			function resetTable() {
				clearDimming();
				disableAddToCartButton();
				clearIcon.style.display = "none";
				attributes.forEach(function(attribute) {
					if (dropdowns[attribute]) {
						dropdowns[attribute].selectedIndex = 0;
					}
				});
				jQuery(variationForm).trigger("reset_data");
				populatePrintStyleDropdown();

				var rows = table.querySelectorAll("tbody tr");
				rows.forEach(function(row) {
					row.style.display = "none";
				});

				const defaultRows = document.querySelectorAll(".wc-variations-table .default-row");             
				defaultRows.forEach(row => {
					row.style.display = "";
					row.style.opacity = "1";
					console.log("Default row reset: ", row);
				});
				removeHeaders();
			}

			sortTable(0, true);

			if (table) {
				table.addEventListener("click", function(e) {
					const target = e.target;
					if (target.tagName === "TD") {
						const row = target.parentElement;
						clearIcon.style.display = "inline";
						if (!row.classList.contains("default-row")) {
							updateDimming(row);
							activateAddToCartButton();
						}
						var attributes = JSON.parse(row.getAttribute("data-attributes"));

						for (var attribute in attributes) {
							var value = attributes[attribute];
							var dropdownAttributeKey = attribute.replace("attribute_", "");

							if (dropdowns[dropdownAttributeKey] && dropdownAttributeKey !== "pa_print-style") {
								dropdowns[dropdownAttributeKey].value = value;
							}
						}

						jQuery(variationForm).trigger("check_variations");
						jQuery(document.body).trigger("woocommerce_found_variation"); 
					}
				});

				Array.from(table.querySelectorAll("th")).forEach(function(headerCell, index) {
					headerCell.addEventListener("click", function() {
						sortTable(index);
					});
				});
				clearIcon.addEventListener("click", function() {
					resetTable();              
				});
			} else {
				console.error("Table not found!");
			}

			attributes.forEach(function(attribute) {
				if (dropdowns[attribute]) {
					dropdowns[attribute].addEventListener("change", function() {
						console.log("Dropdown for attribute " + attribute + " changed. New value: " + dropdowns[attribute].value);

						const wasInDefaultState = isTableInDefaultState();

						filterRowsBySelection();
						highlightMatchingRow();
						clearIcon.style.display = "inline";

						if (wasInDefaultState) {
							addHeaders();
						}

						if (attribute === "pa_print-style" && dropdowns[attribute].value === "") {
							removeHeaders();
							showDefaultRows();
							clearIcon.style.display = "none";
						}
					});
				}
			});

			function filterRowsBySelection() {
				var rows = table.querySelectorAll("tbody tr");
				var selectedSize = dropdowns["pa_size"].value;
				var selectedPrintStyle = dropdowns["pa_print-style"].value;

				if (!selectedPrintStyle) {
					rows.forEach(function(row) {
						row.style.display = "none";
					});
					return;
				}

				rows.forEach(function(row) {
					var rowAttributes = row.getAttribute("data-attributes") ? JSON.parse(row.getAttribute("data-attributes")) : {};
					var rowSize = rowAttributes["attribute_pa_size"];
					var rowPrintStyle = rowAttributes["attribute_pa_print-style"];

					if (rowPrintStyle === selectedPrintStyle) {
						row.style.display = "";
						if (!selectedSize || rowSize === selectedSize) {
							row.style.opacity = "1";
						} else {
							row.style.opacity = "0.4";
							console.log ("loop through rows and set display and opacity based on selection is making the opacity 0.4");
						}
					} else {
						row.style.display = "none";
					}
				});
			}

			function highlightMatchingRow() {
				var rows = table.querySelectorAll("tbody tr");
				var selectedSize = dropdowns["pa_size"].value;
				var selectedPrintStyle = dropdowns["pa_print-style"].value;

				rows.forEach(function(row) {
					var match = true;
					var rowAttributes = row.getAttribute("data-attributes") ? JSON.parse(row.getAttribute("data-attributes")) : {};
					var rowSize = rowAttributes["attribute_pa_size"];
					var rowPrintStyle = rowAttributes["attribute_pa_print-style"];

					if (rowPrintStyle !== selectedPrintStyle || (selectedSize && rowSize !== selectedSize)) {
						match = false;
					}

					if (match) {
						row.style.opacity = "1";
						row.classList.add("selected");
						activateAddToCartButton();
					} else {
						row.style.opacity = "0.4";
						console.log ("highlight matching row is making the opacity 0.4");
						row.classList.remove("selected");
					}
				});
			}

			resetTable(); // Initially hide the table rows on page load

			if (addToCartButton) {
				addToCartButton.addEventListener("click", function() {
					if (!addToCartButton.classList.contains("disabled")) {
						var selectedRow = table.querySelector("tr.selected");
						if (selectedRow) {
							var variationId = selectedRow.getAttribute("data-variation_id");
							var quantity = quantityInput.value || 1;

							customAddToCart(' . $product_id . ', variationId, quantity, parentProductName);
						}
					}
				});
			} else {
				console.error("Add to Cart Button not found!");
			}

			function customAddToCart(productID, variationId, quantity, parentProductName) {
				var selectedPrintStyle = dropdowns["pa_print-style"].value;

				jQuery.ajax({
					url: customAjax.ajaxurl,
					type: "POST",
					data: {
						action: "custom_ajax_add_to_cart",
						product_id: productID,
						variation_id: variationId,
						quantity: quantity,
						parent_product_name: parentProductName
					},
					success: function(response) {
						jQuery("body").trigger("added_to_cart", [response.fragments, response.cart_hash, jQuery(".single_add_to_cart_button")]);

						attributes.forEach(function(attribute) {
							if (dropdowns[attribute]) {
								dropdowns[attribute].value = "";
							}
						});

						quantityInput.value = "1";
						clearDimming();
						disableAddToCartButton();

						if (selectedPrintStyle) {
							dropdowns["pa_print-style"].value = selectedPrintStyle;
							jQuery(dropdowns["pa_print-style"]).trigger("change");
						}
					},
					error: function(response) {
						console.error("Failed to add to cart:", response);
					}
				});
			}

			populatePrintStyleDropdown();

			// New code for custom add to cart for all products
			var customAddToCartContainer = document.createElement("div");
			customAddToCartContainer.className = "custom-add-to-cart-container";

			var customQuantityInput = document.createElement("input");
			customQuantityInput.type = "number";
			customQuantityInput.className = "custom-quantity";
			customQuantityInput.value = 1;
			customQuantityInput.min = 1;
			customAddToCartContainer.appendChild(customQuantityInput);

			var customAddToCartButton = document.createElement("button");
			customAddToCartButton.className = "custom-add-to-cart-button";
			customAddToCartButton.textContent = "Add to Cart";
			customAddToCartContainer.appendChild(customAddToCartButton);

			customAddToCartButton.addEventListener("click", function() {
				var quantity = customQuantityInput.value;
				customAddToCart(productId, 0, quantity, product.name);
			});
		});
	</script>';


    return $output;
}


add_shortcode('wc_master_variations_table', 'wc_master_variations_table');


add_action('wp_ajax_get_variants_for_print_style', 'get_variants_for_print_style');
add_action('wp_ajax_nopriv_get_variants_for_print_style', 'get_variants_for_print_style');

function get_variants_for_print_style() {
    $print_style = $_POST['print_style'];
    $product_id = $_POST['product_id'];
    $product = wc_get_product($product_id);
    $variations = $product->get_available_variations();

    $filtered_variants = array_filter($variations, function($variation) use ($print_style) {
        return isset($variation['attributes']['attribute_pa_print-style']) && $variation['attributes']['attribute_pa_print-style'] === $print_style;
    });

    wp_send_json_success(['variants' => array_values($filtered_variants)]);
}


// Helper function to get product tags excluding 'Print Design'
function get_product_tags_excluding_print_design($product_id) {
    $product_tags = wp_get_post_terms($product_id, 'product_tag', ['fields' => 'ids']);
    $print_design_tag = get_term_by('name', 'Print Design', 'product_tag');
    if ($print_design_tag) {
        $product_tags = array_diff($product_tags, [$print_design_tag->term_id]);
    }
    return $product_tags;
}

// Helper function to render product HTML
function render_product_html($product) {
    ob_start();
    ?>
    <li class="product">
        <a href="<?php echo esc_url($product->get_permalink()); ?>">
            <?php echo $product->get_image(); ?>
            <h2 class="woocommerce-loop-product__title"><?php echo $product->get_name(); ?></h2>
			<span class="price">
            	<?php echo $product->get_price_html(); ?>
			</span>
        </a>
        <a href="<?php echo esc_url($product->get_permalink()); ?>" class="button product_type_variable add_to_cart_button">Select Options</a>
    </li>
    <?php
    return ob_get_clean();
}

// Function to get products with same tag
function get_products_with_same_tag($product_id, $limit = -1) {
    $product_tags = get_product_tags_excluding_print_design($product_id);
    
    if (empty($product_tags)) {
        return [];
    }
    
    $args = array(
        'post_type' => 'product',
        'posts_per_page' => $limit,
        'post__not_in' => array($product_id),
        'tax_query' => array(
            array(
                'taxonomy' => 'product_tag',
                'field' => 'id',
                'terms' => $product_tags,
                'operator' => 'IN',
            ),
        ),
    );
    
    $products = new WP_Query($args);
    return $products->posts;
}

// Shortcode for related merchandise
function related_merch_shortcode($atts) {
    $atts = shortcode_atts(array(
        'columns' => 5,
        'limit' => 5
    ), $atts, 'related_merch');

    global $post;
    
    if (!$post || 'product' !== $post->post_type) {
        return '';
    }
    
    $related_products = get_products_with_same_tag($post->ID, $atts['limit']);
    
    if (empty($related_products)) {
        return '';
    }
    
	ob_start();

	echo '<div class="related-merch-custom-grid custom-product-grid">';
	echo '<ul class="products columns-' . esc_attr($atts['columns']) . '">';
	foreach ($related_products as $related_product) {
		echo render_product_html(wc_get_product($related_product->ID));
	}
	echo '</ul>';
	echo '</div>';

	return ob_get_clean();
	
}

add_shortcode('related_merch', 'related_merch_shortcode');

// Filter to exclude same-tag products from related products
function exclude_same_tag_products_from_related($related_posts, $product_id, $args) {
    $product_tags = get_product_tags_excluding_print_design($product_id);

    if (empty($product_tags)) {
        return $related_posts;
    }

    return array_filter($related_posts, function($related_product_id) use ($product_tags) {
        $related_product_tags = wp_get_post_terms($related_product_id, 'product_tag', ['fields' => 'ids']);
        return empty(array_intersect($product_tags, $related_product_tags));
    });
}
add_filter('woocommerce_related_products', 'exclude_same_tag_products_from_related', 10, 3);

// Function to get standard related products
function get_standard_related_products($product_id, $limit = 4) {
    $product = wc_get_product($product_id);
    if (!$product) {
        return [];
    }

    $cats_array = $product->get_category_ids();
    $tags_array = get_product_tags_excluding_print_design($product_id);

    $args = array(
        'posts_per_page' => $limit * 2,
        'orderby'        => 'rand',
        'post_type'      => 'product',
        'post__not_in'   => array($product_id),
        'tax_query'      => array(
            'relation' => 'OR',
            array(
                'taxonomy' => 'product_cat',
                'field'    => 'id',
                'terms'    => $cats_array,
            ),
            array(
                'taxonomy' => 'product_tag',
                'field'    => 'id',
                'terms'    => $tags_array,
            ),
        ),
    );

    $related_products = new WP_Query($args);

    $filtered_products = array_filter($related_products->posts, function($related_product) use ($product_id) {
        $related_tags = get_product_tags_excluding_print_design($related_product->ID);
        $current_tags = get_product_tags_excluding_print_design($product_id);
        return empty(array_intersect($related_tags, $current_tags));
    });

    return array_slice($filtered_products, 0, $limit);
}

// Shortcode for standard related products
function standard_related_products_shortcode($atts) {
    $atts = shortcode_atts(array(
        'columns' => 4,
        'limit' => 4
    ), $atts, 'standard_related_products');
    global $post;
    
    if (!$post || 'product' !== $post->post_type) {
        return '';
    }
    
	// Check if the current product is in the "merch" category
	error_log("Checking if product is in merch category");
	$product_categories = wp_get_post_terms($post->ID, 'product_cat', array('fields' => 'slugs'));
	if (in_array('merch', $product_categories)) {
		error_log("Product is in the Merch category. No Related Products.");
		return ''; // Return empty string if product is in "merch" category
	}

	$related_products = get_standard_related_products($post->ID, intval($atts['limit']));

	if (empty($related_products)) {
		error_log("No related products found.");
		return '';
	}

	error_log("Product is NOT in the Merch category. Displaying Related Products.");

	ob_start();
	echo '<div class="standard-related-products-custom-grid custom-product-grid">';	
	echo '<ul class="products columns-' . esc_attr($atts['columns']) . '">';
	foreach ($related_products as $related_product) {
		echo render_product_html(wc_get_product($related_product));
	}
	echo '</ul>';
	echo '</div>';	

	return ob_get_clean();
}
add_shortcode('standard_related_products', 'standard_related_products_shortcode');




// Hook to retrieve metadata when loading cart from session
add_filter('woocommerce_get_cart_item_from_session', 'get_cart_item_from_session', 10, 3);
function get_cart_item_from_session($cart_item, $values, $key) {
    error_log("get_cart_item_from_session called for cart item key: " . $key);
    if (isset($values['parent_product_name'])) {
        $cart_item['parent_product_name'] = $values['parent_product_name'];
        error_log("get_cart_item_from_session: Parent Product Name: " . $cart_item['parent_product_name']);
    } else {
        error_log("get_cart_item_from_session: Parent Product Name not found for cart item key: " . $key);
    }
    // Ensuring metadata persistence
    if (isset($values['parent_product_name'])) {
        $cart_item['parent_product_name'] = $values['parent_product_name'];
        error_log("ensure_cart_item_meta_data_persistence: Parent Product Name: " . $values['parent_product_name']);
    } else {
        error_log("ensure_cart_item_meta_data_persistence: Parent Product Name not found for cart item key.");
    }
    return $cart_item;
}

// Ensure cart data is loaded correctly from session
add_action('woocommerce_cart_loaded_from_session', 'load_cart_session', 10, 1);
function load_cart_session($cart) {
//    error_log("load_cart_session called");
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        if (isset($cart_item['parent_product_name'])) {
            error_log("load_cart_session: Parent Product Name: " . $cart_item['parent_product_name']);
        } else {
            error_log("load_cart_session: Parent Product Name not found for cart item key: " . $cart_item_key);
        }
    }
}

// code for adding items to cart and handling metadata
function handle_woocommerce_ajax_add_to_cart() {
    $product_id = absint($_POST['product_id']);
    $variation_id = absint($_POST['variation_id']);
    $quantity = absint($_POST['quantity']);
    $parent_product_name = sanitize_text_field($_POST['parent_product_name']);

    error_log("handle_woocommerce_ajax_add_to_cart called with:");
    error_log("Product ID: $product_id");
    error_log("Variation ID: $variation_id");
    error_log("Quantity: $quantity");
    error_log("Parent Product Name: $parent_product_name");

    $cart_item_data = array(
        'parent_product_name' => $parent_product_name
    );

    $cart_item_key = WC()->cart->add_to_cart($product_id, $quantity, $variation_id, array(), $cart_item_data);

    if ($cart_item_key) {
        error_log("Added to cart. Cart Item Key: $cart_item_key");
    } else {
        error_log("Failed to add to cart.");
    }

    wp_send_json(array(
        'success' => true,
        'product_id' => $product_id,
        'variation_id' => $variation_id,
        'quantity' => $quantity,
        'fragments' => WC_AJAX::get_refreshed_fragments(),
        'cart_hash' => WC()->cart->get_cart_hash(),
    ));
}

add_action('wp_ajax_custom_ajax_add_to_cart', 'handle_woocommerce_ajax_add_to_cart');
add_action('wp_ajax_nopriv_custom_ajax_add_to_cart', 'handle_woocommerce_ajax_add_to_cart');

// Ensure metadata is added when item is added to the cart
add_filter('woocommerce_add_cart_item_data', 'add_custom_data_to_cart_item', 10, 2);
function add_custom_data_to_cart_item($cart_item_data, $product_id) {
    if (!empty($_POST['parent_product_name'])) {
        $cart_item_data['parent_product_name'] = sanitize_text_field($_POST['parent_product_name']);
        error_log("add_custom_data_to_cart_item called. Parent Product Name: " . $cart_item_data['parent_product_name']);
    }
    return $cart_item_data;
}

// Ensure cart item metadata is handled correctly during deletion
add_action('woocommerce_cart_item_removed', 'handle_cart_item_removal', 10, 2);
function handle_cart_item_removal($cart_item_key, $cart) {
    // Additional logic if needed for cleanup
    error_log("Cart item removed: $cart_item_key");
}

// Validate removal process and log errors if any
add_action('woocommerce_remove_cart_item', 'ensure_cart_item_deletion', 10, 2);
function ensure_cart_item_deletion($cart_item_key, $instance) {
    // Additional checks or processing before item removal
    error_log("Attempting to remove cart item: $cart_item_key");
}

// Ensure cart totals are recalculated with metadata
add_action('woocommerce_before_calculate_totals', 'recalculate_cart_totals', 10, 1);
function recalculate_cart_totals($cart) {
    foreach ($cart->get_cart() as $cart_item_key => $cart_item) {
        if (isset($cart_item['parent_product_name'])) {
            // Additional logic if needed
        } else {
            error_log("Cart item not found during recalculate: $cart_item_key");
        }
    }
}

function save_parent_product_name_as_order_meta($item_id, $values, $cart_item_key) {
    if (isset($values['parent_product_name'])) {
        wc_add_order_item_meta($item_id, 'Parent Product Name', $values['parent_product_name']);
        error_log("Saving Parent Product Name to Order Meta: " . $values['parent_product_name']);
    }
}
add_action('woocommerce_add_order_item_meta', 'save_parent_product_name_as_order_meta', 10, 3);

function display_parent_product_in_cart_item($item_data, $cart_item) {
    if (isset($cart_item['parent_product_name'])) {
        $parent_product_name = $cart_item['parent_product_name'];
        array_unshift($item_data, array(
            'key' => 'Print',
            'value' => $parent_product_name,
        ));
        error_log("display_parent_product_in_cart_item called. Parent Product Name: " . $parent_product_name);
    }
    return $item_data;
}
add_filter('woocommerce_get_item_data', 'display_parent_product_in_cart_item', 10, 2);

// Ensure cart item metadata persistence
function ensure_cart_item_meta_data_persistence($cart_item_data, $cart_item) {
    if (isset($cart_item['parent_product_name'])) {
        $cart_item_data['parent_product_name'] = $cart_item['parent_product_name'];
        error_log("ensure_cart_item_meta_data_persistence: Parent Product Name: " . $cart_item['parent_product_name']);
    } else {
        error_log("ensure_cart_item_meta_data_persistence: Parent Product Name not found for cart item key.");
    }
    return $cart_item_data;
}
add_filter('woocommerce_get_cart_item_from_session', 'ensure_cart_item_meta_data_persistence', 20, 2);


add_filter( 'facetwp_index_row', function( $params, $class ) {
  if ( 'subject' == $params['facet_name'] ) {
    $excluded_terms = [ 'Uncategorized', 'Print Designs', 'Merch', 'Hoodies', 'Mugs', 'T-shirts', 'Tote Bags' ];
    if ( in_array( $params['facet_display_value'], $excluded_terms ) ) {
      $params['facet_value'] = '';
    }
  }
  return $params;
}, 10, 2 );


/* enable facetwp ghosts in sidebar product search facet */
add_action('facetwp_scripts', function() {
    ?>
    <script>
        (function($) {
            $(document).on('facetwp-loaded', function() {

                // Identify disabled (ghosted) entries by their CSS class or attribute.
                $('.facetwp-checkbox.disabled').each(function() {
                    var $entry = $(this);

                    // Remove the disabled attribute to make it clickable. 
                    // Optionally style these clickable ghosts with the .facetwp-ghost class.
                    $entry.removeClass('disabled').addClass('facetwp-ghost');

                    // Handle click event to apply the corresponding facet.
                    $entry.on('click', function() {
                        var facetname = $entry.closest('.facetwp-facet').data('name');
                        var facetvalue = $entry.data('value');

                        // Clear all facets except the current one.
                        FWP.facets = {};
                        FWP.facets[facetname] = [facetvalue];

                        // Refresh
                        FWP.is_reset = true; // Don't parse facets.
                        FWP.fetchData();
                        FWP.setHash(); // Update the URL variables.

					    // Refresh the page after updating the URL
                        setTimeout(function() {
                            location.reload();
                        }, 500); // Adjust the delay as needed	
						
                    });
                });
            });
        })(jQuery);
    </script>
    <?php
}, 100);






function custom_breadcrumb() {
    $breadcrumb = '<nav class="custom-navigation"><a href="' . home_url() . '">Home</a>';
    $breadcrumb .= ' <span class="nav-slash">/</span> <a href="https://fauxstainedglasspanes.com/gallery">Gallery</a>';

    if (isset($_GET['_subject'])) {
        $subject = sanitize_title($_GET['_subject']);
        $term = get_term_by('slug', $subject, 'product_cat');
        if ($term) {
            $parents = get_term_parents_list($term->term_id, 'product_cat', array(
                'separator' => ' <span class="nav-slash">/</span> ',
                'link' => false
            ));

            $parent_links = '';
            $parent_terms = explode(' <span class="nav-slash">/</span> ', $parents);
            $added_terms = array();

            foreach ($parent_terms as $parent_name) {
                $parent_slug = sanitize_title($parent_name);
                if (!in_array($parent_slug, $added_terms) && $parent_slug !== $term->slug) {
                    $facetwp_url = home_url('/gallery/?_subject=' . $parent_slug);
                    $parent_links .= ' <span class="nav-slash">/</span> <a href="' . $facetwp_url . '">' . $parent_name . '</a>';
                    $added_terms[] = $parent_slug;
                }
            }
            $breadcrumb .= $parent_links;
            $breadcrumb .= ' <span class="current-term">' . esc_html($term->name) . '</span>';
        }
    }

    if (is_product()) {
        global $post;
        $terms = wp_get_post_terms($post->ID, 'product_cat');
        if ($terms && !is_wp_error($terms)) {
            $main_term = $terms[0];
            $parents = get_term_parents_list($main_term->term_id, 'product_cat', array(
                'separator' => ' <span class="nav-slash">/</span> ',
                'link' => false
            ));

            $parent_links = '';
            foreach (explode(' <span class="nav-slash">/</span> ', $parents) as $parent_name) {
                $parent_slug = sanitize_title($parent_name);
                $facetwp_url = home_url('/gallery/?_subject=' . $parent_slug);
                $parent_links .= ' <span class="nav-slash">/</span> <a href="' . $facetwp_url . '">' . $parent_name . '</a>';
            }
            $breadcrumb .= $parent_links;
            $breadcrumb .= ' <span class="current-term">' . get_the_title($post->ID) . '</span>';
        }            
    } elseif (!is_shop() && !is_product_category() && !is_product()) {
        $breadcrumb .= ' <span class="nav-slash">/</span> <span class="current-term">' . get_the_title() . '</span>';
    }

    $breadcrumb .= '</nav>';
    return $breadcrumb;
}

function custom_navigation_shortcode() {
    return custom_breadcrumb();
}
add_shortcode('custom_navigation', 'custom_navigation_shortcode');

function ajax_custom_breadcrumb() {
    echo custom_breadcrumb();
    wp_die();
}
add_action('wp_ajax_get_custom_breadcrumb', 'ajax_custom_breadcrumb');
add_action('wp_ajax_nopriv_get_custom_breadcrumb', 'ajax_custom_breadcrumb');

function enqueue_custom_breadcrumb_script() {
    wp_localize_script('jquery', 'facetwp_breadcrumbs', array(
        'home_url' => home_url('/'),
        'gallery_url' => 'https://fauxstainedglasspanes.com/gallery',
        'ajaxurl' => admin_url('admin-ajax.php')
    ));
}
add_action('wp_enqueue_scripts', 'enqueue_custom_breadcrumb_script');

function get_term_parents() {
    if (!isset($_POST['subject'])) {
        wp_send_json_error('No subject provided');
    }

    $subject = sanitize_text_field($_POST['subject']);
    $term = get_term_by('slug', $subject, 'product_cat');
    if (!$term) {
        wp_send_json_error('Invalid subject');
    }

    $parents = get_ancestors($term->term_id, 'product_cat');
    $parents = array_reverse($parents);
    $parent_terms = array();

    foreach ($parents as $parent_id) {
        $parent_term = get_term($parent_id, 'product_cat');
        $parent_terms[] = array(
            'name' => $parent_term->name,
            'slug' => $parent_term->slug
        );
    }

    $parent_terms[] = array(
        'name' => $term->name,
        'slug' => $term->slug
    );

    wp_send_json_success($parent_terms);
}
add_action('wp_ajax_get_term_parents', 'get_term_parents');
add_action('wp_ajax_nopriv_get_term_parents', 'get_term_parents');















/* Get rid of annoying main product image zoom on mouse hover */
add_action( 'wp', 'disable_woocommerce_zoom', 99 );
function disable_woocommerce_zoom() {
    remove_theme_support( 'wc-product-gallery-zoom' );
}







/**
 * Enable shortcodes for menus
*/
if ( ! has_filter( 'wp_nav_menu', 'do_shortcode' ) )  {
    add_filter( 'wp_nav_menu', 'shortcode_unautop' );
    add_filter( 'wp_nav_menu', 'do_shortcode', 11 );
}

function change_variation_dropdown_text($args) {
    $args['show_option_none'] = __('Select Size', 'hello-child');
    return $args;
}
add_filter('woocommerce_dropdown_variation_attribute_options_args', 'change_variation_dropdown_text');


/**
 * Remove details tab from woocommerce product data tabs
 */
add_filter( 'woocommerce_product_tabs', 'woo_remove_product_tabs', 98 );

function woo_remove_product_tabs( $tabs ) {

    unset( $tabs['additional_information'] ); // Remove the details tab

    return $tabs;
}




add_action('woocommerce_before_add_to_cart_quantity', function() {
    echo '<div class="custom-quantity-wrapper">';
    echo '<div class="custom-quantity-label">QTY:</div>';
});

add_action('woocommerce_after_add_to_cart_button', function() {
    echo '</div>'; // Close the custom-quantity-wrapper div after the add-to-cart button
});







/* add colon after size in add to cart size input label */
add_filter('woocommerce_form_field_args', function($args, $key, $value) {
    if ($key == 'pa_size') {  // Check if it's the size attribute
        $args['label'] .= ':';  // Append a colon to the label
    }
    return $args;
}, 10, 3);







/* removes reset pop up that messes up add to cart styles
add_filter('woocommerce_reset_variations_link', '__return_empty_string'); */

/* add_filter( 'woocommerce_product_additional_information_tab_title', 'bbloomer_rename_additional_information_product_tab_label' );
 
function bbloomer_rename_additional_information_product_tab_label() {
    return 'Details';
} */

/*removed item has been added to your cart popup*/
add_filter( 'wc_add_to_cart_message_html', '__return_false' );
add_filter('woocommerce_cart_item_removed_notice_type', '__return_null');

















/*expand facetwp submenus when category is clicked*/
add_action( 'wp_footer', function() {
  ?>
    <script>
      document.addEventListener('facetwp-loaded', function() {
        fUtil('.facetwp-checkbox.checked .facetwp-expand').trigger('click');
      });
    </script>
  <?php
}, 100 );

/* loading spinner and face code from facetwp documenation */
add_action( 'facetwp_scripts', function() {
  ?>
  <script>
    (function($) {
 
      // Insert loading icon before the listing template
      $('<div class="loading-icon"></div>').insertBefore('.facetwp-template');
 
      // On start of the facet refresh, but not on first page load
      $(document).on('facetwp-refresh', function() {
        if ( FWP.loaded ) {
          $('.facetwp-template, .loading-icon').addClass('loading');
        }
      });
 
      // On finishing the facet refresh
      $(document).on('facetwp-loaded', function() {
        $('.facetwp-template, .loading-icon').removeClass('loading');
      });
 
    })(jQuery);
  </script>
 
  <style>
 
    .loading-icon {
      display: block;
      width: 20px;
      height: 20px;
      margin: 0 auto -20px auto; /* Center icon and use negative bottom margin the same as the icon height so it does not take up vertical space */
      background-image: url('/wp-content/plugins/facetwp/assets/images/loading.png');
      background-size: cover;
      animation: spin 700ms infinite linear;
      opacity: 0;
    }
 
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
 
    /* Fade in/out of the loading icon */
    .loading-icon.loading {
      opacity: 1;
      transition: opacity 0.2s ease-out;
    }
 
    /* Fade in/out of the whole listing template */
    .facetwp-template {
      opacity: 1;
      transition: opacity 0.1s ease-out;
    }
    .facetwp-template.loading {
      opacity: 0;
    }
 
  </style>
  <?php
}, 100 );


add_action( 'wp_head', function() {
  ?>
  <script>
    (function($) {
      $(document).on('facetwp-refresh', function() {
          if ( FWP.soft_refresh == true )  {
            FWP.enable_scroll = true;
          } else {
            FWP.enable_scroll = false;
          }
      });
      $(document).on('facetwp-loaded', function() {
        if (FWP.enable_scroll == true) {
          $('html, body').animate({
            scrollTop: $('.facetwp-template').offset().top -80
          }, 500);
        }
      });
    })(jQuery);
  </script>
<?php } );



function copyright_shortcode() {
			return '&copy; ' . date('Y') . ' Stuff is Parts, LLC';
}
add_shortcode('copyright', 'copyright_shortcode');

/* Add new columns to the admin products list */
add_filter( 'manage_edit-product_columns', 'custom_product_columns', 20 );
function custom_product_columns( $columns ) {
    // Adding new columns for each attribute
    $columns['product_motif'] = __( 'Motif', 'hello-child' );
    $columns['product_orientation'] = __( 'Orientation', 'hello-child' );
    $columns['product_style'] = __( 'Style', 'hello-child' );

    return $columns;
}

/* Populate the new columns with attribute values */
add_action( 'manage_product_posts_custom_column', 'custom_product_columns_content', 10, 2 );
function custom_product_columns_content( $column, $postid ) {
    $product = wc_get_product( $postid );

    switch ($column) {
        case 'product_motif':
            $motif = $product->get_attribute( 'motif' ); // Adjust 'pa_motif' to your attribute slug
            echo $motif ? $motif : __( 'N/A', 'hello-child' );
            break;

        case 'product_orientation':
            $orientation = $product->get_attribute( 'orientation' ); // Adjust 'pa_orientation' to your attribute slug
            echo $orientation ? $orientation : __( 'N/A', 'hello-child' );
            break;

        case 'product_style':
            $style = $product->get_attribute( 'style' ); // Adjust 'pa_style' to your attribute slug
            echo $style ? $style : __( 'N/A', 'hello-child' );
            break;
    }
}
?>