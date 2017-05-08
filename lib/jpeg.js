"use strict";
/*
 * 2017/05/09- (c) yoya@awm.jp
 */

class JPEG {
    constructor() {
	console.log("JPEG");
	this.chunks = [];
    }
    getChunks() {
	return this.chunks;
    }
    //
    markerName(marker2) {
        var markerTable = {
            0xD8:'SOI',
            0xE0:'APP0',  0xE1:'APP1',  0xE2:'APP2',  0xE3:'APP3',
            0xE4:'APP4',  0xE5:'APP5',  0xE6:'APP6',  0xE7:'APP7',
            0xE8:'APP8',  0xE9:'APP9',  0xEA:'APP10', 0xEB:'APP11',
            0xEC:'APP12', 0xED:'APP13', 0xEE:'APP14', 0xEF:'APP15',
            0xFE:'COM',
            0xDB:'DQT',
            0xC0:'SOF0', 0xC1:'SOF1',  0xC2:'SOF2',  0xC3:'SOF3',
            0xC5:'SOF5', 0xC6:'SOF6',  0xC7:'SOF7',
            0xC8:'JPG',  0xC9:'SOF9',  0xCA:'SOF10', 0xCB:'SOF11',
            0xCC:'DAC',  0xCD:'SOF13', 0xCE:'SOF14', 0xCF:'SOF15',
            0xC4:'DHT',
            0xDA:'SOS',
            0xD0:'RST0', 0xD1:'RST1', 0xD2:'RST2', 0xD3:'RST3',
            0xD4:'RST4', 0xD5:'RST5', 0xD6:'RST6', 0xD7:'RST7',
            0xDD:'DRI',
            0xD9:'EOI',
            0xDC:'DNL',   0xDE:'DHP',  0xDF:'EXP',
            0xF0:'JPG0',  0xF1:'JPG1', 0xF2:'JPG2',  0xF3:'JPG3',
            0xF4:'JPG4',  0xF5:'JPG5', 0xF6:'JPG6',  0xF7:'JPG7',
            0xF8:'JPG8',  0xF9:'JPG9', 0xFA:'JPG10', 0xFB:'JPG11',
            0xFC:'JPG12', 0xFD:'JPG13'
        };
        if (marker2 in markerTable) {
            return markerTable[marker2];
        }
        return "(unknown)";
    }
    parse(buf) {
	var iob = new IOBin(buf, "B");
	while (iob.hasNext(2)) {
	    var baseOffset = iob.getByteOffset();
	    var infos = [];
	    var marker1 = iob.getUI8();
	    while (marker1 !== 0xff) {
		if (iob.hasNext(1) === false) {
		    console.error("XXXXX");
		    return ;
		}
		console.debug("JPEG: skip wrong marker1:"+marker1);
		marker1 = iob.getUI8();
	    }
	    var marker2 = iob.getUI8();
	    infos.push({offset:0, marker:this.markerName(marker2)});
	    switch (marker2) {
	    case 0xD8: case 0xD9: // SOI, EOI
                break;
	    case 0xDA: // SOS
            case 0xD0: case 0xD1: case 0xD2: case 0xD3: // RST0 - RST3
            case 0xD4: case 0xD5: case 0xD6: case 0xD7: // RST4 - RST7
		while (iob.hasNext(1)) {
		    if (iob.seekToCode(0xFF) === false) {
			console.error("no 0xFF terminate:");
			break;
		    }
		    if (iob.peekUI8() !== 0x00) {
			break;
		    }
		}
		break;
	    default:
		var len = iob.getUI16();
		infos.push({offset:2, len:len});
		var b = iob.getBytes(len - 2);
		//console.log("b", b);
	    }
	    var nextOffset = iob.getByteOffset();
            var bytes = iob.readBytes(baseOffset, nextOffset - baseOffset);
	    this.chunks.push({bytes:bytes, infos:infos});
	}
    }
	
}
