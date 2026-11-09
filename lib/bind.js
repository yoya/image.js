"use strict";
/*
 * 2017/02/27- (c) yoya@awm.jp
 */

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
    // URL query: ?<tableId>_<index>=<value>
    const urlParams = new URL(document.location).searchParams;
    for (const input of table.querySelectorAll("input")) {
	const value = urlParams.get(input.id);
	if (value !== null) {
	    if (input.type === "text") {
		input.value = value;
	    } else {
		input.checked = ! [ "0", "false", "" ].includes(value);
	    }
	}
	input.addEventListener("change", function() {
	    values = getTableValues(tableId);
	    callback(table, values, width);
	});
    }
}

/*
 * mouse position in the element.
 * for a canvas, it is in the canvas pixels, corrected by the display scale
 * (the canvas may be shown smaller or larger by CSS, e.g. max-width:100%).
 */
function getCursolPosition(elem, e) {
    const { offsetX, offsetY } = e;  // CSS px from the padding edge
    if (! (elem instanceof HTMLCanvasElement)) {
        return [offsetX, offsetY];
    }
    const style = getComputedStyle(elem);
    const padLeft = parseFloat(style.paddingLeft) || 0;
    const padTop  = parseFloat(style.paddingTop)  || 0;
    const padRight  = parseFloat(style.paddingRight)  || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;
    const contentWidth  = elem.clientWidth  - padLeft - padRight;
    const contentHeight = elem.clientHeight - padTop  - padBottom;
    if ((contentWidth <= 0) || (contentHeight <= 0)) {
        return [offsetX, offsetY];
    }
    return [(offsetX - padLeft) * elem.width  / contentWidth,
            (offsetY - padTop)  * elem.height / contentHeight];
}

/*
 * canvas pixels per CSS pixel (1 when shown at the natural size).
 * use it to keep a hit-test radius constant on the screen.
 */
function getCanvasDisplayScale(canvas) {
    const width = canvas.clientWidth;
    return (width > 0)? (canvas.width / width): 1;
}

/*
 * call back when the display scale of the canvas changes
 * (e.g. window resize with max-width:100%), to redraw overlays
 * such as markers at a constant size on the screen.
 */
function observeCanvasDisplayScale(canvas, callback) {
    if (typeof ResizeObserver === "undefined") {
        return ;
    }
    let lastScale = getCanvasDisplayScale(canvas);
    let pending = false;
    new ResizeObserver(function() {
        if (pending) {
            return ;
        }
        pending = true;
        requestAnimationFrame(function() {
            pending = false;
            const scale = getCanvasDisplayScale(canvas);
            if (Math.abs(scale - lastScale) > 0.01) {
                lastScale = scale;
                callback(scale);
            }
        });
    }).observe(canvas);
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
            const [x, y] = getCursolPosition(elem, e);
            params[id].x = x;
            params[id].y = y;
            params[id].buttons = e.buttons;
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

// write a changed value to the URL query (read back by bindQueryValue),
// so that the current settings can be shared or reloaded.
function bindWriteQuery(key, value, elems) {
    try {
        const url = new URL(document.location);
        for (const elem of elems) {  // drop the legacy id-style query
            if (elem.id && (elem.id !== key)) {
                url.searchParams.delete(elem.id);
            }
        }
        url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
        history.replaceState(history.state, "", url);
    } catch (e) {
        console.warn("bindWriteQuery:", e);
    }
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
            if (rel && (elem.type !== "button")) {
                bindWriteQuery(key, value, elems);  // shareable URL
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

// reflect params to the elements
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
