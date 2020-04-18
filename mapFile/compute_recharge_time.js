
function compute_recharge_time(battery_capacity, terminal_power, current_soc){
    /**
     * Return dictionnary -->
     * {
     *     "time_int_format": 81;
     *     "time_string_format": "1H21"
     * }
     * 81 is in minutes, in int type
     */
    if (LOG.debug_compute_recharge_time){
        console.log("Start compute_recharge_time");
        console.log('battery_capacity: ', battery_capacity,
            '\nterminal_power: ', terminal_power,
            '\ncurrent_soc: ', current_soc);
    }
    //  For first step
    let t1, t2, t3, t4;
    let step_soc = get_step_soc(terminal_power);
    t1 = get_recharge_time(step_soc, current_soc, battery_capacity, terminal_power, 1);
    t2 = get_recharge_time(step_soc, current_soc, battery_capacity, terminal_power, 2);
    t3 = get_recharge_time(step_soc, current_soc, battery_capacity, terminal_power, 3);
    t4 = get_recharge_time(step_soc, current_soc, battery_capacity, terminal_power, 4);
    let time_int_format = t1 + t2 + t3 + t4;
    time_int_format = Math.round(time_int_format);
    let time_string_format = convert_time(time_int_format);
    let data_time = {
        "time_int_format": time_int_format,
        "time_string_format": time_string_format
    };
    if (LOG.debug_compute_recharge_time){
        console.log("End compute_recharge_time");
        console.log('data_time: ', data_time);
    }
    return data_time;
}

function convert_time(minute){
    /**
     * transform minute to hours
     * example: 81 --> output will be: 1H21 (string)
     */
    if (LOG.debug_compute_recharge_time){
        console.log("Start convert_time");
        console.log('minute: ', minute);
    }
    let time, day = 0;
    if (minute<60)
    {
        time = (minute.toString() + " min");
    }
    else{
        let hour = 0;
        do{
            minute = minute - 60;
            hour ++;
        } while (minute >= 60);
        if (hour >= 24){
            do{
                hour = hour - 24;
                day++;
            } while (hour >= 24);
            if (minute < 10){
                time = (day.toString()+"J".toString()+"H0"+ minute.toString());
            }
            else
                time = (day.toString()+"J".toString()+"H"+ minute.toString());
        }
        if (minute < 10){
            time = (hour.toString()+"H0"+ minute.toString());
        }
        else
            time = (hour.toString()+"H"+ minute.toString());
    }
    if (LOG.debug_compute_recharge_time){
        console.log("End convert_time");
        console.log('time: ', time);
    }
    return time;



}
function get_step_soc(terminal_power){
    /*
     * Return step SOC (State of Charge) thanks to terminal power.
     * From the subject table, here are the SOC levels depending on the power of the terminal
     */
    if (LOG.debug_compute_recharge_time){
        console.log("Start get_step_soc");
        console.log('terminal_power: ', terminal_power);
    }
    let step_soc;
    switch (true) {
        case terminal_power >= 40:
            step_soc = 75;
            break;
        case terminal_power >= 35:
            step_soc = 81;
            break;
        case terminal_power >= 30:
            step_soc = 83;
            break;
        case terminal_power >= 25:
            step_soc = 85;
            break;
        case terminal_power >= 20:
            step_soc = 88;
            break;
        case  terminal_power >= 15:
            step_soc = 92;
            break;
        case terminal_power >= 10:
            step_soc = 95;
            break;
        case terminal_power >= 5:
            step_soc = 98;
            break;
        case terminal_power >= 0:
            step_soc = 98;
            break;
    }
    if (LOG.debug_compute_recharge_time){
        console.log("End get_step_soc");
        console.log('step_soc: ', step_soc);
    }
    return step_soc;
}

function get_recharge_time(step_soc, current_soc, battery_capacity, terminal_power, step){
    /**
     * Return recharge time.
     * step 1: 1st stage: max power until SOC level
     * step 2: 2nd level: we load at 75% of P max.
     * step 3: 3nd level: we load at 50 of P max.
     * step 4: 4nd level: we load at 25% of P max.
     */
    if (LOG.debug_compute_recharge_time){
        console.log("Start get_recharge_time");
        console.log('step_soc: ', step_soc,
            '\ncurrent_soc: ', current_soc,
            '\nbattery_capacity: ', battery_capacity,
            '\nterminal_power: ', terminal_power,
            '\nstep: ', step);
    }
    let time;
    if (step === 1) {
        if (current_soc < step_soc) {
            time = 60 * (step_soc - current_soc)/100 * (battery_capacity / terminal_power);
        }
        else
            time = 0;
    }
    else if (step === 2) {
        if (current_soc < step_soc) {
            time = 60 * ((((step_soc+100)/2)-step_soc)/100) * (battery_capacity/(0.75*terminal_power));
        }
        else if (current_soc < (step_soc+100)/2){
            time = 60 * ((((step_soc+100)/2)-current_soc)/100) * (battery_capacity/(0.75*terminal_power));
        }
        else
            time = 0;
    }
    else if (step === 3) {
        if (current_soc < step_soc) {
            time = 60*((((step_soc+500)/6)-((step_soc+100)/2))/100) * (battery_capacity/(0.5*terminal_power));
        }
        else if (current_soc < (step_soc + 500)/6) {
            time = 60*((((step_soc+500)/6)-current_soc)/100) * (battery_capacity/(0.5*terminal_power));
        }
        else
            time = 0;
    }
    else if (step === 4) {
        if (current_soc < 100) {
            time =  60*(100-step_soc)/100 * battery_capacity/(0.25*terminal_power)
        }
        else if (current_soc < (step_soc + 500)/6) {
            time = 60*(100-(((step_soc+500)/6))/100) * battery_capacity/(0.25*terminal_power)
        }
        else
            time = 0;
    }
    if (LOG.debug_compute_recharge_time){
        console.log("End get_recharge_time");
        console.log('time: ', time);
    }
    return time;
}


function get_terminal_power(last_way_point_info){
    /**
     * Return float, it is terminal_power (corresponding to step_soc in the code)
     * Default terminal_power is the first elements of connection.
     * if value is null, default value is 50 (average of data)
     */
    let terminal_power = {
        "value": null,
        "step": true,
        'problem': false
    };
    if (LOG.debug_compute_recharge_time){
        console.log("Start get_terminal_power");
        console.log('last_way_point_info: ', last_way_point_info);
    }
    if(last_way_point_info['Connections'].length === 0){
        console.log("You can't recharging here");
        terminal_power['step'] = false;
    }
    else
    {
        terminal_power['value'] = last_way_point_info['Connections'][0]['PowerKW'];
        if (last_way_point_info['Connections'][0]['PowerKW'] == null){
            terminal_power['value'] = 50;
            terminal_power['problem'] = true;
    }
    }
    if (LOG.debug_compute_recharge_time){
        console.log("End get_terminal_power");
        console.log('terminal_power: ', terminal_power);
    }
    return terminal_power;
}

function get_battery_capacity() {
    /**
     * Get battery_capacity from windows
     * Returns will be float
     */
    if (LOG.debug_compute_recharge_time){
        console.log("Start get_battery_capacity");
    }
    let battery_capacity = parseFloat(document.getElementById('BatteryCapacity').value);
    if (LOG.debug_compute_recharge_time){
        console.log("End get_battery_capacity");
        console.log('battery_capacity: ', battery_capacity);
    }
    return battery_capacity;
}