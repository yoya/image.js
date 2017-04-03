"use strict";
/*
 * 2017/01/05- (c) yoya@awm.jp
 */

function dropFunction(target, func, datatype) {
    // console.debug("dropFunction");
    var cancelEvent = function(e) {
	e.preventDefault();
	e.stopPropagation();
	return false;
    };
    target.addEventListener("dragover" , cancelEvent, false);
    target.addEventListener("dragenter", cancelEvent, false);
    target.addEventListener("drop"     , function(e) {
        e.preventDefault();
	var file = e.dataTransfer.files[0];
	var reader = new FileReader();
        reader.onload = function(e) {
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
        return false;
    }, false);
    target.addEventListener("paste", function(e) {
	console.log(e);
	if (!e.clipboardData 
            || !e.clipboardData.types
            || (e.clipboardData.types.length != 1)
            || (e.clipboardData.types[0] != "Files")) {
	    // do nothing
	} else {
	    var file = e.clipboardData.items[0].getAsFile();
	    var reader = new FileReader();
	    reader.onload = function(e) {
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
        return false;
    }, false);

}
