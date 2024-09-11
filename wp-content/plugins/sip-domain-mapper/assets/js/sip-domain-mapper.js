jQuery(document).ready(function($) {
    console.log('SIP Domain Mapper JS loaded');
    console.log('Debug info:', sipDebug);

	function updateMappingsTable(mappings) {
    	console.log('Updating table with mappings:', mappings);
    	var $tbody = $('#active-mappings table tbody');
    	$tbody.empty();
    	$.each(mappings, function(domain, pageId) {
        	console.log('Adding mapping:', domain, pageId);
        	var pageName = $('#new-page option[value="' + pageId + '"]').text();
        	console.log('Page name:', pageName);
        	var $row = $('<tr>')
            	.append($('<td>').text(domain))
            	.append($('<td>').html(pageName + ' <button class="button-link remove-mapping" data-domain="' + domain + '">x</button>'));
        	$tbody.append($row);
    	});
	}

    function handleMappingAction(action, domain, pageId) {
        $.post(sipDebug.ajaxurl, {
            action: 'handle_mapping_action',
            nonce: sipDebug.nonce,
            mapping_action: action,
            domain: domain,
            page_id: pageId
        }, function(response) {
            console.log('AJAX response:', response);
            if (response.success) {
                updateMappingsTable(response.data.mappings);
            } else {
                console.error('Failed to ' + action + ' mapping:', response);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('AJAX request failed:', textStatus, errorThrown);
        });
    }

    $('#add-mapping').on('click', function() {
        var domain = $('#new-domain').val();
        var pageId = $('#new-page').val();
        if (domain && pageId) {
            handleMappingAction('add', domain, pageId);
            $('#new-domain').val('');
            $('#new-page').val('');
        } else {
            alert('Please enter both a domain and select a page.');
        }
    });

    $(document).on('click', '.remove-mapping', function() {
        var domain = $(this).data('domain');
        handleMappingAction('remove', domain, 0);
    });

    // Initial load of mappings
    handleMappingAction('get', '', 0);
});