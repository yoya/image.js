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
    var params = { };
    var onCIEXYZdata = function(arr) {
        params['cieArrAll'] = arr;
        params['cieArr'] = arr[0]["WRGB"];
	drawSpectrumGraphBase(graphCanvas, params);
        for (var i = 0 ; i <  arr.length; i++) {
            var personalArr = arr[i];
	    params['cieArr'] = personalArr["WRGB"];
            drawSpectrumGraphCMF(graphCanvas, params);
        }
    }
    bindFunction({"MCheckbox":null, "FCheckbox":null,
                  "ageMinRange":"ageMinText", "ageMaxRange":"ageMaxText",
                  "ICheckbox":null, "IICheckbox":null},
		 function(target, rel) {
                     var id = target.id;
                     elems[id] = document.getElementById(id);
                     var ageMax = elems["ageMaxRange"].value;
                     var ageMin = elems["ageMinRange"].value
                     if (ageMin > ageMax) {
                         if (target.id == "ageMaxRange") {
                             ageMin = ageMax;
                             elems["ageMinRange"].value = ageMin;
                             elems["ageMinText"].value = ageMin;
                         } else {
                             ageMax = ageMin;
                             elems["ageMaxRange"].value = ageMax;
                             elems["ageMaxText"].value = ageMax;
                         }
                     }
                     var arr = params['cieArrAll'];
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
	             drawSpectrumGraphBase(graphCanvas, params);
                     for (var i = 0 ; i <  arr.length; i++) {
                         var personalArr = arr[i];
	                 params['cieArr'] = personalArr["WRGB"];
                         drawSpectrumGraphCMF(graphCanvas, params);
                     }
                 } );
    //
    loadCIE10ind_data(onCIEXYZdata);
}
