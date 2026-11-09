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
            if (!elem) {
                console.error("not found element id:"+id);
                continue;
            }
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
    let urlParams = new URL(document.location).searchParams;
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
	    continue;
	}
	var type = elem1.type;
	var elem2 = document.getElementById(id2);
	if (id2) {
	    if (!elem2) {
		console.error("!elem2 <= id2:"+id2);
		continue;
	    }
	    type += ":" + elem2.type;
	}
        const value = urlParams.get(id1);
	switch(type) {
	case "range:text":
	    bindRange2TextFunction(elem1, elem2, callback, params);
            if (value) {
                const f = parseFloat(value);
                elem1.value = f;
                params[id1] = params[id2] = value;
            }
	    break;
	case "color:text":
	    bindColor2TextFunction(elem1, elem2, callback, params);
            if (value) {
                elem1.value = elem2.value = value;
                params[id1] = params[id2] = value;
            }
	    break;
	case "checkbox":
	    bindChangeEvent(elem1, callback, params);
            if (value) {
                const b = [0, "0", "false"].includes(value);
                elem1.checked = !b
                params[id1] = !b;
            }
	    break;
	case "select-one":
	    bindChangeEvent(elem1, callback, params);
	    break;
	case "select-multiple":
	    bindChangeEvent(elem1, callback, params);
	    break;
	case "text":
	    bindChangeEvent(elem1, callback, params);
            if (value) {
                elem1.value = value;
                params[id1] = value;
            }
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
    params[color.id] = color.value;
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
	if (!input) {
	    console.error("not found element id:"+inputId);
	    continue;
	}
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
    if (!table) {
        console.error("not found element id:"+tableId);
        return ;
    }
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
            const { offsetX, offsetY, buttons } = e;
            params[id].x = offsetX;
            params[id].y = offsetY;;
            params[id].buttons = buttons;
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

/*
 * data-bind binding
 *
 * HTML:
 *   <input type="range" data-bind="gamma" min="0.25" max="4" value="1">
 *   <input type="text"  data-bind="gamma" size="5">
 *   <input type="checkbox" data-bind="R" checked>
 * JS:
 *   bindParams(params, function(key, elem, rel) { ... });
 *   => params.gamma (number), params.R (boolean)
 *
 * elements of the same key are synchronized.
 * value type is decided by the primary element of the key
 *   (range/number: number, checkbox: boolean,
 *    select-multiple: array, others: string)
 * URL query: ?gamma=2 (the element id, e.g. ?gammaRange=2, is also accepted)
 */

const bindAttrName = "data-bind";
const boundElements = new WeakSet();

// { key: [elem, ...] } in document order
function bindElementGroups(root, keys) {
    const groups = new Map();
    for (const elem of root.querySelectorAll("["+bindAttrName+"]")) {
        const key = elem.getAttribute(bindAttrName);
        if (keys && (! keys.includes(key))) {
            continue;
        }
        if (! groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(elem);
    }
    if (keys) {
        for (const key of keys) {
            if (! groups.has(key)) {
                console.error("not found "+bindAttrName+" key:"+key);
            }
        }
    }
    return groups;
}

// the element which decides the value type (range rather than text)
function bindPrimaryElement(elems) {
    for (const elem of elems) {
        if (elem.type !== "text") {
            return elem;
        }
    }
    return elems[0];
}

function bindGetValue(elem, elems) {
    switch (elem.type) {
    case "range":
    case "number":
        return parseFloat(elem.value);
    case "checkbox":
        return elem.checked;
    case "radio":
        for (const e of elems) {
            if (e.checked) {
                return e.value;
            }
        }
        return null;
    case "select-multiple":
        return Array.from(elem.selectedOptions, opt => opt.value);
    default:  // text, select-one, color, button, ...
        return elem.value;
    }
}

function bindSetValue(elem, value) {
    switch (elem.type) {
    case "checkbox":
        elem.checked = Boolean(value);
        break;
    case "radio":
        elem.checked = (elem.value === String(value));
        break;
    case "select-multiple":
        for (const opt of elem.options) {
            opt.selected = value.includes(opt.value);
        }
        break;
    case "button":
        break;  // keep the label
    default:
        elem.value = value;
        break;
    }
}

function bindQueryValue(urlParams, key, elems) {
    let value = urlParams.get(key);
    for (const elem of elems) {
        if ((value === null) && elem.id) {
            value = urlParams.get(elem.id);  // legacy id-style query
        }
    }
    return value;
}

// normalize a value (e.g. clamp by the range) through the primary element
function bindNormalize(primary, elems, value) {
    if (primary.type === "checkbox") {
        if (typeof value === "string") {
            value = ! [ "0", "false", "" ].includes(value);
        }
    } else if (primary.type === "select-multiple") {
        if (typeof value === "string") {
            value = value.split(",");
        }
    }
    bindSetValue(primary, value);
    return bindGetValue(primary, elems);
}

function bindParams(params, callback, options) {
    const { root = document, keys = null } = options || {};
    const urlParams = new URL(document.location).searchParams;
    const groups = bindElementGroups(root, keys);
    for (const [key, elems] of groups) {
        const primary = bindPrimaryElement(elems);
        // initial value: the primary element (HTML value attribute), or query
        let value = bindGetValue(primary, elems);
        const queryValue = bindQueryValue(urlParams, key, elems);
        if (queryValue !== null) {
            value = bindNormalize(primary, elems, queryValue);
        }
        params[key] = value;
        for (const elem of elems) {
            bindSetValue(elem, value);
        }
        // events
        const update = function(elem, rel) {
            let value = bindGetValue(elem, elems);
            if (elem !== primary) {
                value = bindNormalize(primary, elems, value);
            }
            params[key] = value;
            for (const e of elems) {
                if (e !== elem) {
                    bindSetValue(e, value);
                }
            }
            if (elem.type === "text") {  // show normalized value
                bindSetValue(elem, value);
            }
            callback && callback(key, elem, rel);
        };
        for (const elem of elems) {
            if (boundElements.has(elem)) {
                console.error("already bound element, key:"+key);
                continue;
            }
            boundElements.add(elem);
            switch (elem.type) {
            case "range":
            case "color":
                elem.addEventListener("input", () => update(elem, false));
                elem.addEventListener("change", () => update(elem, true));
                break;
            case "button":
                elem.addEventListener("click", () => update(elem, true));
                break;
            default:  // text, number, checkbox, radio, select-*
                elem.addEventListener("change", () => update(elem, true));
                break;
            }
        }
    }
    return params;
}

// reflect params to the elements (successor of bind2elements)
// the value is normalized by the primary element (e.g. range step & clamp),
// and written back to params to keep it the same as the elements.
function syncParamsToElements(params, options) {
    const { root = document, keys = null } = options || {};
    const groups = bindElementGroups(root, keys);
    for (const [key, elems] of groups) {
        if (! (key in params)) {
            continue;
        }
        const primary = bindPrimaryElement(elems);
        const value = bindNormalize(primary, elems, params[key]);
        params[key] = value;
        for (const elem of elems) {
            bindSetValue(elem, value);
        }
    }
}
