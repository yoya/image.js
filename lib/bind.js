"use strict";
/*
 * 2017/02/27- (c) yoya@awm.jp
 */

function bindFunction(idMap, callback){
    for (var id1 in idMap) {
	var id2 = idMap[id1];
	var elem1 = document.getElementById(id1);
	if (!elem1) {
	    console.error("!elem1 <= id1:"+id1);
	    return ;
	}
	var type = elem1.type;
	var elem2 = document.getElementById(id2);
	if (id2) {
	    if (!elem2) {
		console.error("!elem2 <= id2:"+id2);
		return ;
	    }
	    type += ":" + elem2.type;
	}
	// console.debug("bind type:"+type+", id1:"+id1+", id2:"+id2);
	switch(type) {
	case "range:text":
	    bindRange2TextFunction(elem1, elem2, callback);
	    break;
	case "checkbox":
	    bindChengeEvent(elem1, callback);
	    break;
	case "select-one":
	    bindChengeEvent(elem1, callback);
	    break;
	case "text":
	    bindChengeEvent(elem1, callback);
	    break;
	case "button":
	    bindClickEvent(elem1, callback);
	    break;
	case "radio":
	    bindChengeEvent(elem1, callback);
	    break;
	default:
	    console.error("Unknown bind type:"+type+", id1:"+id1+", id2:"+id2);
	    break;
	}
    }
}

function bindRange2TextFunction(range, text, callback) {
    text.value = range.value;
    range.addEventListener("input", function() {
	text.value = range.value;
	callback && callback(range);
    });
    text.addEventListener("change", function() {
	range.value = text.value;
	callback && callback(text);
    });
}

// includes: checkbox, select-one
function bindChengeEvent(target, callback) {
    target.addEventListener("change", function() {
	callback && callback(target);
    });
}

// button
function bindClickEvent(target, callback) {
    target.addEventListener("click", function() {
	callback && callback(target);
    });
}

/*
 * table binding
 */

function prefixTableValue(tableId) {
    return tableId+"_";
}

function setTableValues(tableId, values) {
    var valueIdPrefix = prefixTableValue(tableId);
    for (var i = 0, n = values.length ; i < n ; i++) {
	var inputId = valueIdPrefix+i;
	var input = document.getElementById(inputId);
	if (input.type === "text") {
	    input.value = values[i];
	} else if ((input.type === "radio") || (input.type === "checkbox")) {
	    input.checked = values[i];
	} else {
	    console.error("illegal type:"+input.type);
	}
    }
}

function getTableValues(tableId) {
    var valueIdPrefix = prefixTableValue(tableId);
    var values = [];
    for (var i = 0; true ; i++) {
	var inputId = valueIdPrefix+i;
	var input = document.getElementById(inputId);
	if (input === null) {
	    break;
	}
	if (input.type === "text") {
	    values.push(parseFloat(input.value));
	} else if ((input.type === "radio") || (input.type === "checkbox")) {
	    values.push(input.checked);
	} else {
	    console.error("illegal type:"+input.type);
	}
    }
    return values;
}

function bindTableFunction(tableId, callback, values, width, type) {
    var table = document.getElementById(tableId);
    // generate filter table dom
    var i = 0, n = values.length;
    var height = (n / width) >> 0;
    if (n !== width * height) {
	console.error("n:"+n+" !== width:"+width+" * height:"+height);
    }
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    var valueIdPrefix = prefixTableValue(tableId);
    for (var y = 0 ; y < height ; y++) {
	var tr = document.createElement("tr")
	table.appendChild(tr);
	for (var x = 0 ; x < width ; x++) {
	    var td = document.createElement("td")
	    tr.appendChild(td);
	    var input = document.createElement("input")
	    td.appendChild(input);
	    if ((type === "radio") || (type === "checkbox")) {
		input.type = type;
		input.name = tableId;
	    } else {
		input.type = "text";
	    }
	    input.id = valueIdPrefix+i;
	    input.size = 8;
	    i++;
	}
    }
    setTableValues(tableId, values);
    for (var i = 0 ; i < n ; i++) {
	var map = {}
	map[valueIdPrefix+i] = null;
	bindFunction(map, function(target) {
	    values = getTableValues(tableId);
	    callback(table, values, width);
	});
    }
}
