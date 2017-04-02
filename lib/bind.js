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
	switch(type) {
	case "range:text":
	    bindRange2TextFunction(elem1, elem2, callback);
	    break;
	case "checkbox":
	    bindCheckbox(elem1, callback);
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
	callback && callback();
    });
    text.addEventListener("change", function() {
	range.value = text.value;
	callback && callback();
    });
}

function bindCheckbox(checkbox, callback) {
    checkbox.addEventListener("change", function() {
	callback && callback();
    });
}
