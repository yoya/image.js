"use strict";
/*
 * 2017/02/27- (c) yoya@awm.jp
 */

function bindFunction(type, id1, id2, callback){
    var elem1 = document.getElementById(id1);
    var elem2 = document.getElementById(id2);
    if ((!elem1) || (!elem2)) {
	console.error("!elem1 || !elem2 <= id1:"+id1+",id2:"+id2);
	return ;
    }
    switch(type) {
    case "range2text":
	bindRange2TextFunction(elem1, elem2, callback);
	break;
    default:
	console.error("Unknown bind type:"+type+", id1:"+id1+", id2:"+id2);
    }
}

function bindRange2TextFunction(range, text, callback) {
    text.value = range.value;
    range.addEventListener("input", function() {
	text.value = range.value;
	console.debug(callback);
	callback && callback();
    });
    text.addEventListener("input", function() {
	range.value = text.value;
	callback && callback();
    });
}
