/**
 * Manage the cars.
 */

const requestURL_cars = './mapFile/cars.json';


function init_cars() {
    /**
     * Get brand et model.
     */
    if (LOG.debug_cars){
        console.log("Start init_cars");
    }
    get_cars_brands();
    document.getElementById("brand").addEventListener("change", get_cars_models);
    document.getElementById("model").addEventListener("change", get_car_autonomy);
    if (LOG.debug_cars){
        console.log("End init_cars");
    }
}

function get_cars_brands() {
    /**
     * Get car brands.
     */
    if (LOG.debug_cars){
        console.log("Start get_cars_brands");
    }
    let request = get_json(requestURL_cars);
    request.send();
    request.onload = function () {
        let cars = request.response;
        for(let brand in cars) {
            document.getElementById('brand').options[document.getElementById('brand').options.length]=new Option(brand, brand);
        }
        if (LOG.debug_cars){
            console.log("End get_cars_brands");
        }
    }
}

function get_cars_models() {
    /**
     * Get cars models.
     */
    if (LOG.debug_cars){
        console.log("Start get_cars_models");
    }
    let request = get_json(requestURL_cars);
    request.send();
    request.onload = function () {
        let cars = request.response;
        let brand = document.getElementById('brand').value;
        document.getElementById('model').options.length = 0;
        for(let model in cars[brand]) {
            document.getElementById('model').options[document.getElementById('model').options.length]=new Option(model,model);
        }
        let model = document.getElementById('model').value;
        get_car_autonomy();
    };
    if (LOG.debug_cars){
        console.log("End get_cars_models");
    }
}

function get_car_autonomy() {
    if (LOG.debug_cars){
        console.log("Start get_car_autonomy");
    }
    let request = get_json(requestURL_cars);
    request.send();
    request.onload = function () {
        let cars = request.response;
        let brand = document.getElementById('brand').value;
        let model = document.getElementById('model').value;
        console.log(cars);
        console.log(cars[brand][model]['Autonomy']);
        document.getElementById('autonomieKM').value = cars[brand][model]['Autonomy'];
        console.log("BatteryCapacity",cars[brand][model]['BatteryCapacity']);
        document.getElementById('BatteryCapacity').value = cars[brand][model]['BatteryCapacity'];
    };
    if (LOG.debug_cars){
        console.log("End get_car_autonomy");
    }
}