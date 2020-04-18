const CONFIG = {
    "mapbox_token" : "pk.eyJ1IjoiYml2ZW8iLCJhIjoiY2s2aHoyamUwMDhlNTNrcWx0YmEwamx2bSJ9.XQjceSGr-ElKQXKtqM7Tsg",
    "open_charge_map_token" : "34a712ec-e23f-4035-96c8-3177e0bf2d90",
    "base_latitude" : 45.7578137,
    "base_longitude" : 4.8320114,
    "open_charge_map": false,
};

const markBlue = L.icon({
    iconUrl: 'assets/img/marker/marker-blue-m.png',
    iconSize: [64, 64],
    iconAnchor: [32,64],
    shadowUrl: '',
    shadowSize: [0, 0]
});

const markRed = L.icon({
    iconUrl: 'assets/img/marker/marker-red-m.png',
    iconSize: [64, 64],
    iconAnchor: [32,64],
    shadowUrl: '',
    shadowSize: [0, 0]
});

const markGreen = L.icon({
    iconUrl: 'assets/img/marker/marker-green-m.png',
    iconSize: [64, 64],
    iconAnchor: [32,64],
    shadowUrl: '',
    shadowSize: [0, 0]
});

const navigationStyle = {
    "color": "#B000DC",
    "weight": 5,
    "opacity": 0.65
};