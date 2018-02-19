"use strict";

/*
  2018/02/19- yoya@awm.jp
  ref)
  - http://www.color.org/icc32.pdf
  - https://github.com/yoya/IO_ICC
*/

class ICCBinary extends Binary {
    getDateTime() {
	return {
	    'Year':    this.getUint16(),
	    'Month':   this.getUint16(),
	    'Day':     this.getUint16(),
	    'Hours':   this.getUint16(),
	    'Minutes': this.getUint16(),
	    'Seconds': this.getUint16()
	};
    }
    getXYZ() {
	return {
	    'X':this.getS15Fixed16(),
	    'Y':this.getS15Fixed16(),
	    'Z':this.getS15Fixed16()
	};
    }
    getS15Fixed16() {
	return this.getSint32() / 0x10000; // BigEndian ???
    }
}
    
class IO_ICC {
    constructor() {
    }
    static signature() {
	return []; //
    }
    static verifySig(arr) {
	var binary = new ICCBinary("BigEndian", arr);
	var profileSize = binary.getUint32(arr);
	if (profileSize !== arr.length) {
	    return false;
	}
	// Device class check 'scnr', 'mntr', 'prtr'
	// Connection Color Space check 'XYZ ', 'Lab '
	return true;
    }
    parse(arr) {
	// this.arr = arr;
	var header = {};
	var tagTable = [];
	var arrLen = arr.length;
	var binary = new ICCBinary("BigEndian", arr);
	header['ProfileSize'] = binary.getUint32();
	header['CMMType'] = binary.getText(4);
	header['ProfileVersion'] = { 'major':binary.getUIBCD8(),
				'minor':binary.getUIBCD8() };
	binary.getUint16(); // profile version reserved
	header['ProfileDeviceClass'] = binary.getText(4);
	header['ColorSpace'] = binary.getText(4);
	header['ConnectionSpace'] = binary.getText(4);
	header['DataTimeCreated'] = binary.getDateTime();
	header['AcspSignature'] = binary.getText(4);
	header['PrimaryPlatform'] = binary.getText(4);
	var cmmOptions1 = binary.getUint16();
        var cmmOptions2 = binary.getUint16();
	header['CMMOptions'] = {
	    'EmbedProfile': (cmmOptions1 & 1) !== 0,
            'Independently':(cmmOptions1 & 2) !== 0
	};
	header['DeviceManufacturer'] = binary.getUint32();
        header['DeviceModel'] = binary.getUint32();
        var deviceAttribute1 = binary.getUint32();
        var deviceAttribute2 = binary.getUint32();
        header['DeviceAttribute'] = {
            'ReflectiveOrTransparency':(deviceAttribute1 & 1) !== 0,
            'GlossyOnMatte':           (deviceAttribute1 & 2) !== 0,
	};
        header['RenderingIntent'] = binary.getUint32();
        header['XYZvalueD50'] = binary.getXYZ();
        header['CreatorID'] = binary.getUint32();
	this.header = header;
	//
	binary.setCursol(128); // 128: HeaderSize
	var tagTableCount = binary.getUint32();
	for (var i = 0 ; i < tagTableCount ; i++) {
	    var tag = { 'Signature':binary.getText(4),
			'Offset':binary.getUint32(),
			'Size':binary.getUint32() };
	    tag['Type'] = binary.readText(arr, tag['Offset'], 4);
	    tag['arr'] = arr;
	    tagTable.push(tag);
	}
	this.tagTable = tagTable;
	//
	return true;
    }
    getHeader() {
	return this.header;
    }
    getTagTable() {
	return this.tagTable;
    }
    getTagDetail(tag) {
	switch (tag['Type']) {
	case "desc":
	    return this.getTagDetailDesc(tag);
	case "text":
	    return this.getTagDetailText(tag);
	}
	return null;
    }
    getTagDetailDesc(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	if (type !== 'desc') {
	    console.log("type is not desc:"+type);
	    return null;
	}
	binary.getSubArray(4); // skip
	var asciiCount = binary.getUint32();
	if (asciiCount > 0) {
	    tagDetail['Ascii'] = binary.getText(asciiCount);
	}
	console.log(asciiCount);
	tagDetail['UnicodeLanguage'] = binary.getText(4);
	var unicodeCount = binary.getUint32();
	if (unicodeCount > 0) {
	    var ucs2be = binary.getSubArray(unicodeCount * 2);
	    var decoder = new TextDecoder("utf-16be");
	    tagDetail['Unicode'] = decoder.decode(ucs2be);
	}
	tagDetail['ScriptCode'] = binary.getUint16();
	var macintoshCount = binary.getUint8();
	if (macintoshCount > 0) {
	    tagDetail['Macintosh'] = binary.getText(macintoshCount);
	}
	return tagDetail;
    }
    getTagDetailText(tag) {
	var tagDetail = {};
	var arr = tag['arr'];
	var offset = tag['Offset'];
	var size = tag['Size'];
	var binary = new ICCBinary("BigEndian", arr.subarray(offset, offset + size));
	var type = binary.getText(4);
	if (type !== 'text') {
	    console.log("type is not text:"+type);
	    return {};
	}
	binary.getSubArray(4); // skip
	tagDetail['Text'] = binary.getText(size - 8);
	return tagDetail;
    }
    build() {
	;
    }
}
