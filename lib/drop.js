"use strict";
/*
 * 2017/01/05- (c) yoya@awm.jp
 */

function IsSafari() {
    var ua = navigator.userAgent;
    var hasVersion = ua.indexOf('Version/') > -1;
    var hasChrome  = ua.indexOf('Chrome/') > -1;
    var hasSafari  = ua.indexOf('Safari/') > -1;
    return hasVersion && (! hasChrome) && hasSafari;
}

function dropFunction(target, func, datatype) {
    // console.debug("dropFunction:", target, func, datatype);
    var cancelEvent = function(e) {
	e.preventDefault();
	e.stopPropagation();
	return false;
    };
    var fileReadEvent = function(file, func) {
	// console.debug("fileReadEvent:", file, func);
	var reader = new FileReader();
        reader.onload = function(e) {
	    // console.debug("reader.onload", e, e.target.result);
	    func(e.target.result);
        }
	switch (datatype) {
	case "DataURL":
	    reader.readAsDataURL(file);
	    break;
	case "ArrayBuffer":
	    reader.readAsArrayBuffer(file);
	    break;
	default:
	    console.error("Unknown datatype:"+datatype);
	    break;
	}
    }
    target.addEventListener("dragover" , cancelEvent, false);
    target.addEventListener("dragenter", cancelEvent, false);
    target.addEventListener("drop"     , function(e) {
	e.preventDefault();
	e.stopPropagation();
	var file = e.dataTransfer.files[0];
	if (file) {
	    fileReadEvent(file, func);
	}
    }, false);
    target.addEventListener("paste", async function(e) {
	// console.debug("paste", e);
        cancelEvent(e);
        const contents = await navigator.clipboard.read();
        const item = contents[0];
        if (item.types.includes("image/png")) {
            const blob = await item.getType("image/png");
            const url = URL.createObjectURL(blob);
	    func(url);
        } else {
            console.warn("Clipboard contains non-image data.");
        }
    }, false)
}
