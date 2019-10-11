'use strict';
/*
 * 2019/04/30- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

const elemIds = [
    'MCheckbox', 'FCheckbox',
    'ageMinRange', 'ageMinText', 'ageMaxRange', 'ageMaxText',
    'ICheckbox', 'IICheckbox'];

const elems = {};
for (const i in elemIds) {
    const id = elemIds[i];
    elems[id] = document.getElementById(id);
}

function main() {
    console.debug('cie_ind main()');
    const params = {
        'guide':true,
        'xMin':400,
'xMax':700,
        'yMin':-0.7,
'yMax':4.0
    };
    const onCIEXYZdata = function(arr) {
        params.cieArrAll = arr;
        params.cieArr = [];
	drawSpectrumGraphBase(graphCanvas, params);
        drawSpectrumGraphAxis(graphCanvas, params);
        for (let i = 0; i <  arr.length; i++) {
            const personalArr = arr[i];
	    params.cieArr = personalArr.WRGB;
            drawSpectrumGraphCMF(graphCanvas, params);
        }
    };
    bindFunction({
'MCheckbox':null,
'FCheckbox':null,
                  'ageMinRange':'ageMinText',
'ageMaxRange':'ageMaxText',
                  'ICheckbox':null,
'IICheckbox':null
},
		 function(target, rel) {
                     const id = target.id;
                     elems[id] = document.getElementById(id);
                     if (target.id == 'MCheckbox') {
                         if (!elems.MCheckbox.checked) {
                             elems.FCheckbox.checked = true;
                         }
                     }
                     if (target.id == 'FCheckbox') {
                         if (!elems.FCheckbox.checked) {
                             elems.MCheckbox.checked = true;
                         }
                     }
                     let ageMax = elems.ageMaxRange.value;
                     let ageMin = elems.ageMinRange.value;
                     if (ageMin > ageMax) {
                         if (target.id == 'ageMaxRange') {
                             ageMin = ageMax;
                             elems.ageMinRange.value = ageMin;
                             elems.ageMinText.value = ageMin;
                         } else {
                             ageMax = ageMin;
                             elems.ageMaxRange.value = ageMax;
                             elems.ageMaxText.value = ageMax;
                         }
                     }
                     if (target.id == 'ICheckbox') {
                         if (!elems.ICheckbox.checked) {
                             elems.IICheckbox.checked = true;
                         }
                     }
                     if (target.id == 'IICheckbox') {
                         if (!elems.IICheckbox.checked) {
                             elems.ICheckbox.checked = true;
                         }
                     }
                     let arr = params.cieArrAll;
                     arr = arr.filter(function(p) {
                         if (!elems[p.Sex + 'Checkbox'].checked) {
                             return false;
                         }
                         const age = p.Age;
                         if ((age < ageMin) || (ageMax < age)) {
                             return false;
                         }
                         if (!elems[p.Conditions + 'Checkbox'].checked) {
                             return false;
                         }
                         return true;
                     });
                     graphCanvas.width = graphCanvas.width;
                     params.cieArr = [];
	             drawSpectrumGraphBase(graphCanvas, params);
                     drawSpectrumGraphAxis(graphCanvas, params);
                     for (let i = 0; i <  arr.length; i++) {
                         const personalArr = arr[i];
	                 params.cieArr = personalArr.WRGB;
                         drawSpectrumGraphCMF(graphCanvas, params);
                     }
                 });
    //
    loadCIE10ind_data(onCIEXYZdata);
}
