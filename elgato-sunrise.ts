import { ElgatoLightAPI, KeyLight, KeyLightOptions } from 'elgato-light-api';
const { createModel } = require("polynomial-regression");
const SunCalc = require("suncalc");

var position = SunCalc.getTimes(new Date(), 50.79482, -0.0032629);
//console.log(position);

// regression models for understanding the color temperature of sunlight
var colorTemperatureData = [
    [timeToDecimal(position.dawn), 344],
    [timeToDecimal(position.sunrise), 285],
    [timeToDecimal(position.solarNoon), 189],
    [timeToDecimal(position.sunset), 285],
    [timeToDecimal(position.dusk), 344],
];
var colorTemperatureModel = createModel();
colorTemperatureModel.fit(colorTemperatureData, [3, 20]);

// regression models for understanding the intensity sunlight
var intensityData = [
    [timeToDecimal(position.dawn), 3],
    [timeToDecimal(position.sunrise), 15],
    [timeToDecimal(position.solarNoon), 30],
    [timeToDecimal(position.sunset), 10],
    [timeToDecimal(position.dusk), 3],
];
var intensityModel = createModel();
intensityModel.fit(intensityData, [3, 20]);

const lightAPI = new ElgatoLightAPI();
lightAPI.on('newLight', (newLight: KeyLight) => {
    console.log(newLight.name);
});

setInterval(function(){
    var now = new Date();
    var hour = timeToDecimal(now);
    var ct = Math.min(344, Math.floor(colorTemperatureModel.estimate(3, hour)));
    var lum = Math.max(2, Math.floor(intensityModel.estimate(3, hour)));

    console.log();

	lightAPI.updateAllLights({
        numberOfLights: 1,
        lights: [{
            on: lum < 3 ? 0 : 1,
            temperature: ct,
            brightness: lum < 3 ? 3 : lum
        }]
    }).then(() => {
        console.log("Updated Lights (Hour: " + hour + ", Temperature: " + ct + ", Intensity: " + lum);
    }).catch(e => {
        console.error("Error: ", e);
    });
}, 5000);

function timeToDecimal(date: Date): number {
    return date.getHours() + (date.getMinutes() * 0.01667);
}