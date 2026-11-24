"use strict";
/*
 * 2019/04/30- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var elemIds = [
    "MCheckbox", "FCheckbox",
    "ageMinRange", "ageMinText", "ageMaxRange", "ageMaxText",
    "ICheckbox", "IICheckbox"];

var elems = {};
for (var i in elemIds) {
    var id = elemIds[i];
    elems[id] = document.getElementById(id);
}

function main() {
    console.debug("cie_ind main()");
    var params = {
        'guide':true,
        'xMin':400, 'xMax':700,
        'yMin':-0.7, 'yMax':4.0,
    };
    var onCIEXYZdata = function(arr) {
        params['cieArrAll'] = arr;
        params['cieArr'] = [];
	drawSpectrumGraphBase(graphCanvas, params);
        drawSpectrumGraphAxis(graphCanvas, params);
        for (var i = 0 ; i <  arr.length; i++) {
            var personalArr = arr[i];
	    params['cieArr'] = personalArr["WRGB"];
            drawSpectrumGraphCMF(graphCanvas, params);
        }
    }
    bindParams({}, function(key, target, rel) {
                     var id = target.id;
                     elems[id] = document.getElementById(id);
                     if (key == "M") {
                         if (! elems["MCheckbox"].checked) {
                             elems["FCheckbox"].checked = true;
                         }
                     }
                     if (key == "F") {
                         if (! elems["FCheckbox"].checked) {
                             elems["MCheckbox"].checked = true;
                         }
                     }
                     var ageMax = elems["ageMaxRange"].value;
                     var ageMin = elems["ageMinRange"].value
                     if (ageMin > ageMax) {
                         if (key == "ageMax") {
                             ageMin = ageMax;
                             elems["ageMinRange"].value = ageMin;
                             elems["ageMinText"].value = ageMin;
                         } else {
                             ageMax = ageMin;
                             elems["ageMaxRange"].value = ageMax;
                             elems["ageMaxText"].value = ageMax;
                         }
                     }
                     if (key == "I") {
                         if (! elems["ICheckbox"].checked) {
                             elems["IICheckbox"].checked = true;
                         }
                     }
                     if (key == "II") {
                         if (! elems["IICheckbox"].checked) {
                             elems["ICheckbox"].checked = true;
                         }
                     }
                     var arr = params['cieArrAll'];
                     if (! arr) {
                         return ;  // data not loaded yet (drawn when it arrives)
                     }
                     arr = arr.filter(function(p) {
                         if (! elems[p["Sex"]+"Checkbox"].checked) {
                             return false;
                         }
                         var age = p['Age'];
                         if ((age < ageMin) || (ageMax < age)) {
                             return false;
                         }
                         if (! elems[p["Conditions"]+"Checkbox"].checked) {
                             return false;
                         }
                         return true;
                     });
                     graphCanvas.width = graphCanvas.width;
                     params['cieArr'] = [];
	             drawSpectrumGraphBase(graphCanvas, params);
                     drawSpectrumGraphAxis(graphCanvas, params);
                     for (var i = 0 ; i <  arr.length; i++) {
                         var personalArr = arr[i];
	                 params['cieArr'] = personalArr["WRGB"];
                         drawSpectrumGraphCMF(graphCanvas, params);
                     }
                 }, {keys: ["M", "F", "ageMin", "ageMax", "I", "II"]});
    //
    loadCIE10ind_data(onCIEXYZdata);
}
