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
	var tag = {};
	tagTable.push(tag);
	//
	this.tagTable = tagTable;
	//
	console.log(this);
	return ;
    }
    getChunkList() {
	return this.chunkList;
    }
    build() {
	;
    }
}
