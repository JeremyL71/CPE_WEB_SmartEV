/**
 * Manage the map. I you want to enter debug mode, pass true var 'debug' in config.js
 */

var path = L.geoJSON();
var markerO = L.marker([0, 0], {icon: markGreen});
var markerD = L.marker([0, 0], {icon: markRed});
var mapboxToken = CONFIG.mapbox_token;
var total_time = 0;

window.onload = function () {
    /**
     * Create and print map.
     */
    if (LOG.debug_map) {
        console.log("Start map.js");
    }
    init_cars();
    let requestURL = './mapFile/openchargemap-france.json';
    let map = L.map('map').setView([CONFIG.base_latitude, CONFIG.base_longitude], 7);
    L.tileLayer(
        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        {
            'attribution': "map",
            'maxZoom': 18,
            //        id: 'mapbox/streets-v11', //default
            //        id: 'biveo/ck6mgqgqw14v21jo50pz3oqvi', //dark mode
            'id': 'biveo/ck6rwy4ef0tgc1imdr4q57bau',
            'accessToken': CONFIG.mapbox_token
        }
    ).addTo(map);
    let itinerary = {};
    let request = get_json(requestURL);
    request.send();
    request.onload = function () {
        let list_charge_point = request.response;
        let clusterChargePoint = L.markerClusterGroup();
        for (let charge_point of list_charge_point) {
            let description = get_description(charge_point);
            let tmpMarker = L.marker([charge_point['AddressInfo']['Latitude'],
                    charge_point['AddressInfo']['Longitude']],
                {icon: markBlue}).bindPopup(description);
            clusterChargePoint.addLayer(tmpMarker);
        }
        map.addLayer(clusterChargePoint);
    };
    document.getElementById('launchNav').onclick = function () {
        /**
         * Put marker on the map and launch navigation process.
         */
        Promise.all([
            search_location(map, 'addOrigin', markerO),
            search_location(map, 'addDestination', markerD)
        ]).then(function () {
            nav_calculator(map, markerO, markerD, path, itinerary).then(function () {
                console.log("Successful")
            });
        });
    };
    if (LOG.debug_map) {
        console.log("End map.js");
    }
};

function get_description(charge_point) {
    /**
     * Return description for marker
     * Output type is a string
     */
    let description = "";
    description = description.concat("<h3>",
        charge_point['AddressInfo']['Title'],
        '</h3><p>',
        charge_point['AddressInfo']['AddressLine1'],
        '<br/>',
        charge_point['AddressInfo']['AccessComments'],
        '</p>'
    );
    return description;
}

async function search_location(map, idElement, marker) {
    /**
     * Search location
     */
    if (LOG.debug_map) {
        console.log("Start search_location");
        console.log('map: ', map,
            '\nidElement: ', idElement,
            '\nmarker: ', marker)
    }
    return new Promise(function (resolve) {
        let search = document.getElementById(idElement).value;
        let requestURL = '';
        if (LOG.debug_map) {
            console.log("Start anonymous function into search_location");
            console.log('search: ', search)
        }
        requestURL = requestURL.concat('https://api.mapbox.com/geocoding/v5/mapbox.places/',
            search,
            '.json?access_token=',
            mapboxToken);
        let request = get_json(requestURL);
        request.send();
        request.onload = function () {
            let addresses = request.response;
            let latitude = addresses['features']['0']['center']['1'];
            let longitude = addresses['features']['0']['center']['0'];
            if (LOG.debug_map) {
                console.log("End anonymous function into search_location");
                console.log('latitude: ', latitude, '\nlongitude: ', longitude)
            }
            marker.setLatLng(L.latLng(latitude, longitude)).addTo(map);
            resolve();
        };
        if (LOG.debug_map) {
            console.log("End search_location");
        }
    });
}


function get_json(requestURL) {
    /**
     * requestURL: string
     * return request: object
     */
    if (LOG.debug_map) {
        console.log("Start get_json");
        console.log('requestURL: ', requestURL)
    }
    let request = new XMLHttpRequest();
    request.open('GET', requestURL);
    request.responseType = 'json';
    if (LOG.debug_map) {
        console.log("End get_json");
        console.log('request: ', request)
    }
    return (request);
}

async function nav_calculator(map, markerO, markerD) {
    /**
     * Compute the navigation.
     */
    if (LOG.debug_map) {
        console.log("Start nav_calculator");
        console.log('map: ', map,
            '\nmarkerO: ', markerO,
            '\nmarkerD: ', markerD)
    }
    clear();
    total_time = 0;
    print_indication("Origin", document.getElementById('addOrigin').value, "");
    let autonomy_km = Number(document.getElementById('autonomieKM').value);
    let autonomy_at_the_begin = Number(document.getElementById('autonomieDepart').value);
    let list_way_points = [];
    let result = null;
    let last_way_point = null;
    let last_way_point_info = null;
    let navigation = {};

    do {
        navigation = await path_calculator(map, markerO, markerD, list_way_points, 'full');
        navigation = await charge_calculator(navigation,
            autonomy_km,
            autonomy_at_the_begin,
            list_way_points,
            last_way_point,
            last_way_point_info
        );
        result = await way_point_finder(navigation, list_way_points, last_way_point);
        if (result !== null) {
            last_way_point = result[0];
            last_way_point_info = result[1];
            list_way_points.push(last_way_point);
        }
    } while (result !== null);
    await path_calculator(map, markerO, markerD, list_way_points, 'full');
    for (let point of list_way_points) {
        point.addTo(map);
    }
    let total_recharge_time = "Total recharge time: " + convert_time(total_time);
    console.log("last total_time: ", total_time);
    print_indication("Destination",
        document.getElementById('addDestination').value,
        total_recharge_time);

    if (LOG.debug_map) {
        console.log("End nav_calculator");
        console.log('list_way_points: ', list_way_points)
    }
}


async function path_calculator(map, markerO, markerD, list_way_points, overview) {
    /**
     * Print the path on the map.
     */
    if (LOG.debug_map) {
        console.log("Start path_calculator");
        console.log('map: ', map,
            '\nmarkerO: ', markerO,
            '\nmarkerD: ', markerD,
            '\nlist_way_points: ', list_way_points,
            '\noverview: ', overview)
    }
    let originLatLng = markerO.getLatLng();
    let destinationLatLng = markerD.getLatLng();
    let requestURL = 'https://api.mapbox.com/directions/v5/mapbox/driving/';
    requestURL = requestURL.concat(originLatLng['lng'],
        ',',
        originLatLng['lat'],
        ';');
    for (let way_points of list_way_points) {
        requestURL = requestURL.concat(way_points.getLatLng()['lng'],
            ',',
            way_points.getLatLng()['lat'],
            ';');
    }
    requestURL = requestURL.concat(destinationLatLng['lng'],
        ',',
        destinationLatLng['lat'],
        '.json?overview=',
        overview,
        '&steps=true&&geometries=geojson&access_token=',
        mapboxToken
    );
    console.log('requestURL: ', requestURL);
    let result = await fetch(requestURL);
    let navigation = await result.json();
    map.removeLayer(path);
    path = L.geoJSON(navigation['routes']['0']['geometry'], {style: navigationStyle});
    path.addTo(map);
    if (LOG.debug_map) {
        console.log("End path_calculator");
        console.log('navigation: ', navigation)
    }
    return navigation;
}

function get_indications(terminal_power, current_soc) {
    /**
     * Return indications for print in table
     */
    if (LOG.debug_map) {
        console.log("Start get_indication");
        console.log('terminal_power: ', terminal_power,
            '\ncurrent_soc: ', current_soc);
    }
    let battery_capacity = get_battery_capacity();
    let recharge_time;
    let data_time = compute_recharge_time(battery_capacity, terminal_power['value'], current_soc);
    total_time = total_time + data_time['time_int_format'];
    if (terminal_power['problem']) {
        recharge_time = "(The result may be different) " + data_time['time_string_format'];
    } else
        recharge_time = data_time['time_string_format'];
    if (LOG.debug_map) {
        console.log("End get_indication");
        console.log('recharge_time: ', recharge_time);
    }
    return recharge_time;
}

async function charge_calculator(navigation,
                                 autonomy_km,
                                 autonomy_at_the_begin,
                                 list_way_points,
                                 last_way_point,
                                 last_way_point_info) {
    /**
     * Compute the remaining autonomy and return it into the navigation.
     */
    const trigger_distance_charge_point = 500;
    if (LOG.debug_map_charge_calculator) {
        console.log("Start charge_calculator");
        console.log('navigation: ', navigation,
            '\nautonomy_km: ', autonomy_km,
            '\nautonomy_at_the_begin: ', autonomy_at_the_begin,
            '\nlist_way_points: ', list_way_points,
            '\nlast_way_point: ', last_way_point);
    }
    let remaining_autonomy_km = autonomy_at_the_begin * autonomy_km / 100;
    let flag = false;
    let step_saved;
    let current_point, arrival_point;
    let terminal_power, current_soc, recharge_time, validator, alternative;
    let list_step = navigation['routes']['0']['geometry']['coordinates'];
    let need_load = false;
    if (list_way_points.length === 0) {
        need_load = true;
    }

    for (let step of list_step) {
        if (!flag) {
            flag = true;
        } else {
            current_point = {
                'latitude': step_saved[1],
                'longitude': step_saved[0],
            };
            arrival_point = {
                'latitude': step[1],
                'longitude': step[0],
            };
            remaining_autonomy_km = remaining_autonomy_km - get_the_geodesic(arrival_point, current_point) / 1000;
            if (list_way_points.length !== 0) {
                for (let way_point of list_way_points) {
                    current_point = {
                        'latitude': way_point.getLatLng()['lat'],
                        'longitude': way_point.getLatLng()['lng'],
                    };
                    if (get_the_geodesic(arrival_point, current_point) < trigger_distance_charge_point) {
                        if (way_point === last_way_point && need_load === false) {
                            need_load = true;
                            current_soc = remaining_autonomy_km / autonomy_km * 100;
                            terminal_power = get_terminal_power(last_way_point_info);
                            if (!terminal_power['step']) {
                                let substitute_step = await get_the_nearest_point(current_point['latitude'],
                                    current_point['longitude']);
                                terminal_power = get_terminal_power(substitute_step);
                                if (!terminal_power['step']) {
                                    print_indication("Charge Point",
                                        last_way_point_info['AddressInfo']['Title'],
                                        "Sorry no data for this Charge Point, Try google :/");
                                    validator = false;
                                    recharge_time = 0;
                                } else {
                                    last_way_point_info = substitute_step;
                                    validator = true;
                                    alternative = true;
                                }
                            }
                            if (validator) {
                                recharge_time = get_indications(terminal_power, current_soc);
                                if (!alternative) {
                                    print_indication("Charge Point",
                                        last_way_point_info['AddressInfo']['Title'],
                                        recharge_time);
                                } else {
                                    print_indication("Charge Point",
                                        last_way_point_info['AddressInfo']['Title'],
                                        "Attention, this is a replacement point, " +
                                        "disregard the marker on the map",
                                        recharge_time);
                                }

                            }
                            if (LOG.debug_map) {
                                console.log('recharge_time: ', recharge_time);
                                console.log('total_time: ', total_time);
                            }
                        }
                        remaining_autonomy_km = autonomy_km;
                    }
                }
                validator = true;
                alternative = false;
            }
        }
        step['remaining_autonomy'] = remaining_autonomy_km / autonomy_km * 100;
        step['need_load'] = need_load;
        step_saved = step;
        if (LOG.debug_map_charge_calculator) {
            console.log("remaining_autonomy: ", step['remaining_autonomy']);
            console.log("need_load: ", step['need_load']);
        }
    }
    if (LOG.debug_map_charge_calculator) {
        console.log("End charge_calculator");
        console.log('navigation: ', navigation)
    }
    return navigation;
}

async function way_point_finder(navigation) {
    /**
     *  Find way point on the road.
     */
    const trigger_autonomy = 20;
    let longitude, latitude;
    let address;

    if (LOG.debug_map) {
        console.log("Start way_point_finder");
        console.log('navigation: ', navigation);
    }
    let point = null;
    for (let step of navigation['routes']['0']['geometry']['coordinates']) {
        if (point == null) {
            if (step['remaining_autonomy'] < trigger_autonomy && step['need_load'] === true) {
                point = step;
            }
        }
    }
    if (point == null) {
        return null;
    } else {
        if (CONFIG.open_charge_map) {
            console.log("Online");
            let requestURL = '';
            requestURL = requestURL.concat('https://api.openchargemap.io/v3/poi/?output=json&longitude=',
                point[0],
                '&latitude=',
                point[1],
                '&apikey=',
                CONFIG.open_charge_map_token);
            let result = await fetch(requestURL);
            result = await result.json();
            address = result['0'];
        } else {
            console.log("Offline");
            address = await get_the_nearest_point(point[1], point[0]);
        }
        longitude = address['AddressInfo']['Longitude'];
        latitude = address['AddressInfo']['Latitude'];
        if (LOG.debug_map) {
            console.log("End way_point_finder");
            console.log('longitude: ', longitude,
                '\nlatitude: ', latitude);
        }
        return [L.marker([latitude, longitude], {icon: markGreen}), address];
    }
}

async function get_the_nearest_point(latitude, longitude) {
    /**
     * latitude: float , longitude: float.
     * return charge_point: dictionary
     */
    if (LOG.debug_map) {
        console.log("Start get_the_nearest_point");
        console.log('longitude: ', longitude,
            '\nlatitude: ', latitude);
    }
    let requestURL = './mapFile/openchargemap-france.json';
    let coordinate = {
        'latitude': latitude,
        'longitude': longitude,
    };
    let addresses = await fetch(requestURL);
    addresses = await addresses.json();
    let flag = false;
    let current_longitude,
        current_latitude,
        current_coordinate,
        min_range,
        current_range,
        address_saved;

    for (let address of addresses) {
        current_longitude = address['AddressInfo']['Longitude'];
        current_latitude = address['AddressInfo']['Latitude'];
        current_coordinate = {
            'latitude': current_latitude,
            'longitude': current_longitude,
        };
        current_range = get_the_geodesic(coordinate, current_coordinate);
        if (!flag) {
            min_range = current_range;
            address_saved = address;
            flag = true;
        } else {
            if (current_range < min_range) {
                min_range = current_range;
                address_saved = address;
            }
        }
    }
    if (LOG.debug_map) {
        console.log("End get_the_nearest_point");
        console.log('address_saved: ', address_saved);
    }
    return address_saved;
}


function get_the_geodesic(arrival_point, current_point) {
    /**
     * Return the geodesic: The geodesic is the trajectory corresponding to the minimum distance between two points on
     a surface. In the case of the sphere, it is an arc of a large circle.
     return length.
     R const is Earth radius in meters.
     "1" reference to arrival_point
     "2" reference to current_point
     method used: https://janakiev.com/blog/gps-points-distance-python/
     */
    if (LOG.debug_map_get_the_geodesic) {
        console.log("Start get_the_geodesic");
        console.log('arrival_point: ', arrival_point,
            '\ncurrent_point: ', current_point);
    }
    const R = 6372800;
    const lat1 = arrival_point['latitude'], lon1 = arrival_point['longitude'];
    const lat2 = current_point['latitude'], lon2 = current_point['longitude'];

    let phi_1 = convert_deg_to_rad(lat1), phi_2 = convert_deg_to_rad(lat2);
    let d_phi = convert_deg_to_rad(lat2 - lat1);
    let d_lambda = convert_deg_to_rad(lon2 - lon1);

    let a = Math.pow(Math.sin(d_phi / 2), 2) + Math.cos(phi_1) * Math.cos(phi_2) * Math.pow(Math.sin(d_lambda / 2), 2);
    let geodesic = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (LOG.debug_map_get_the_geodesic) {
        console.log("End get_the_geodesic");
        console.log('geodesic: ', geodesic);
    }
    return geodesic;
}

function convert_deg_to_rad(degree) {
    /**
     * convert degrees to radians
     Degrees * Pi / 180 ". If we are using earth coordinates, we must also consider a sign.
     For North latitude and East longitude it is a +,
     For South latitude and West longitude it is a -.
     */
    if (LOG.debug_map_convert_deg_to_rad) {
        console.log("Start convert_deg_to_rad");
        console.log('degree: ', degree);
    }
    let rad;
    if (degree >= 0) {
        rad = degree * (Math.PI / 180);
    } else {
        rad = degree * (Math.PI / 180) * (-1);
    }
    if (LOG.debug_map_convert_deg_to_rad) {
        console.log("End convert_deg_to_rad");
        console.log('rad: ', rad);
    }
    return rad;
}

function print_indication(type_of_indication, address_text, charge_time) {
    document.getElementById('indication_table').style.display = "block";
    let html = '';
    html = html.concat("<tr><th>",
        type_of_indication,
        "</th><th>",
        address_text,
        "</th><th>",
        charge_time,
        "</th></tr>");
    document.getElementById('indication').innerHTML = document.getElementById('indication').innerHTML + html;
}

function clear() {
    document.getElementById('indication').innerHTML = "";
}