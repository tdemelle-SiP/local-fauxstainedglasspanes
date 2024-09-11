<?php
function fetch_shop_details($token) {
    $url = 'https://api.printify.com/v1/shops.json';

    $response = wp_remote_get($url, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $token,
        ),
    ));

    if (is_wp_error($response)) {
        return null;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (empty($data) || !isset($data[0]['id']) || !isset($data[0]['title'])) {
        return null;
    }

    return array(
        'shop_id' => $data[0]['id'],
        'shop_name' => $data[0]['title']
    );
}

function sip_connect_shop() {
    $token = get_option('printify_bearer_token');
    $shop_details = fetch_shop_details($token);
    if ($shop_details) {
        update_option('sip_printify_shop_name', $shop_details['shop_name']);
        update_option('sip_printify_shop_id', $shop_details['shop_id']);
    }
}
