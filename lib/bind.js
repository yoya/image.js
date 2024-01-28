"use strict";
/*
 * 2017/02/27- (c) yoya@awm.jp
 */

const globalIdMap = {};

function bind2elements(params) {
    for (const k in globalIdMap) {
        const v = globalIdMap[k];
        const ids = [ k ];
        if (v) {
            ids.push(v);
        }
        for (const id of ids) {
            const elem = document.getElementById(id);
            switch (elem.type) {
            case  "range":
            case  "text":
            case  "select-one":
                elem.value = params[k];
                break;
            case  "checkbox":
                elem.checked = params[k];
                break;
            }
        }
    }
}

function bindFunction(idMap, callback, params){
    if (params === undefined) {
        params = {};
    }
    for (const k in idMap) {
        globalIdMap[k] = idMap[k]
    }
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
	switch(type) {
	case "range:text":
	    bindRange2TextFunction(elem1, elem2, callback, params);
	    break;
	case "color:text":
	    bindColor2TextFunction(elem1, elem2, callback, params);
	    break;
	case "checkbox":
	    bindChangeEvent(elem1, callback, params);
	    break;
	case "select-one":
	    bindChangeEvent(elem1, callback, params);
	    break;
	case "select-multiple":
	    bindChangeEvent(elem1, callback, params);
	    break;
	case "text":
	    bindChangeEvent(elem1, callback, params);
	    break;
	case "button":
	    bindClickEvent(elem1, callback, params);
	    break;
	case "radio":
	    bindChangeEvent(elem1, callback, params);
	    break;
	default:
	    console.error("Unknown bind type:"+type+", id1:"+id1+", id2:"+id2);
	    break;
	}
    }
}

function bindRange2TextFunction(range, text, callback, params) {
    // console.debug("bindRange2TextFunction", range.id, text.id);
    let value = range.getAttribute("value");
    if (value === null) {
        value = text.getAttribute("value");
    }
    text.value = range.value = value;
    // text.value = range.value;  // firefox read previous value.
    params[range.id] = parseFloat(range.value);
    params[text.id] = range.value;
    range.addEventListener("input", function() {
	text.value = range.value;
        params[range.id] = parseFloat(range.value);
        params[text.id] = range.value;
	callback && callback(range, false);
    });
    range.addEventListener("mouseup", function() {
	text.value = range.value;
        params[range.id] = parseFloat(range.value);
        params[text.id] = range.value;
	callback && callback(range, true);
    });
    text.addEventListener("change", function() {
	range.value = text.value;
        text.value = range.value;
        params[range.id] = parseFloat(range.value);
        params[text.id] = range.value;
	callback && callback(text, true);
    });
}

function bindColor2TextFunction(color, text, callback, params) {
    // console.debug("bindColor2TextFunction", color.id, text.id);
    let value = color.getAttribute("value");
    if (value === null) {
        value = text.getAttribute("value");
    }
    text.value = color.value = value;
    // text.value = color.value;  // firefox read previous value.
    params[color.id] = parseFloat(color.value);
    params[text.id] = color.value;
    color.addEventListener("input", function() {
        const value = color.value;
	text.value = value;
        params[color.id] = value;
        params[text.id] = value;
	callback && callback(color, false);
    });
    color.addEventListener("change", function() {
        const value = color.value;
	text.value = value;
        params[color.id] = value;
        params[text.id] = value;
	callback && callback(color, true);
    });
    text.addEventListener("change", function() {
        color.value = text.value;
        const value = color.value;
	text.value = value;
        params[color.id] = value;
        params[text.id] = value;
	callback && callback(text, true);
    });
}

// includes: checkbox, select-one, select-multiple
function bindChangeEvent(target, callback, params) {
    const assignment = function() {
        let value = null;
        if (target.type === "checkbox") {
            value = target.checked;
        } else if (target.type === "select-multiple") {
            value = [];
            for (const opt of target.selectedOptions) {
                value.push(opt.value);
            }
        } else {  // select-one & other
            value = target.value;
        }
        params[target.id] = value;
    };
    target.addEventListener("change", function() {
        assignment(target);
	callback && callback(target, true);
    });
    assignment(target);
}

// button
function bindClickEvent(target, callback, params) {
    params[target.id] = target.value;
    target.addEventListener("click", function() {
        let value = null;
        value = target.value;
        params[target.id] = value;
	callback && callback(target, true);
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

function bindCursolFunction(id, params, callback) {
    params[id] = {x:null, y:null};
    const elem  = document.getElementById(id);
    if (!elem) {
        console.error("not found element id:"+id);
        return ;
    }
    const eventTypeArr = ["mousemove", "mousedown", "mouseup",
                          "mouseenter", "mouseleave", "dblclick"];
    for (let i = 0, n = eventTypeArr.length; i < n; i++) {
        const eventType = eventTypeArr[i];
        elem.addEventListener(eventType, function(e) {
            const x = e.offsetX;
            const y = e.offsetY;
            params[id].x = x;
            params[id].y = y;
            callback && callback(elem, eventType);
        });
    }
}

function bindkeyFunction(params, callback) {
    // const id = "KEYBOARD";
    const elem  = document.body;
    const eventTypeArr = ["keypress"];
    for (let i = 0, n = eventTypeArr.length; i < n; i++) {
        const eventType = eventTypeArr[i];
        elem.addEventListener(eventType, function(e) {
            const event = { alt: e.altKey, ctrl: e.ctrlKey, meta: e.metaKey,
                            key: e.key };
            // params[id] = event;
            callback && callback(event, eventType);
        });
    }
}
