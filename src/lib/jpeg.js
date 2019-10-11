'use strict';

/*
  2017/01/05- yoya@awm.jp
  ref)
  - https://www.w3.org/Graphics/JPEG/itu-t81.pdf
  - https://www.w3.org/Graphics/JPEG/jfif3.pdf
*/

class IO_JPEG {
    constructor() {
	this.binary = new Binary('BigEndian');
    }

    static signature() {
	return [0xFF, 0xD8, 0xFF]; // SOI, something
    }

    markerName(marker2) {
	const markerTable = {
            0xD8:'SOI',
            0xE0:'APP0',
0xE1:'APP1',
0xE2:'APP2',
0xE3:'APP3',
            0xE4:'APP4',
0xE5:'APP5',
0xE6:'APP6',
0xE7:'APP7',
            0xE8:'APP8',
0xE9:'APP9',
0xEA:'APP10',
0xEB:'APP11',
            0xEC:'APP12',
0xED:'APP13',
0xEE:'APP14',
0xEF:'APP15',
            0xFE:'COM',
            0xDB:'DQT',
            0xC0:'SOF0',
0xC1:'SOF1',
0xC2:'SOF2',
0xC3:'SOF3',
            0xC5:'SOF5',
0xC6:'SOF6',
0xC7:'SOF7',
            0xC8:'JPG',
0xC9:'SOF9',
0xCA:'SOF10',
0xCB:'SOF11',
            0xCC:'DAC',
0xCD:'SOF13',
0xCE:'SOF14',
0xCF:'SOF15',
            0xC4:'DHT',
            0xDA:'SOS',
            0xD0:'RST0',
0xD1:'RST1',
0xD2:'RST2',
0xD3:'RST3',
            0xD4:'RST4',
0xD5:'RST5',
0xD6:'RST6',
0xD7:'RST7',
            0xDD:'DRI',
            0xD9:'EOI',
            0xDC:'DNL',
0xDE:'DHP',
0xDF:'EXP',
            0xF0:'JPG0',
0xF1:'JPG1',
0xF2:'JPG2',
0xF3:'JPG3',
            0xF4:'JPG4',
0xF5:'JPG5',
0xF6:'JPG6',
0xF7:'JPG7',
            0xF8:'JPG8',
0xF9:'JPG9',
0xFA:'JPG10',
0xFB:'JPG11',
            0xFC:'JPG12',
0xFD:'JPG13'
	};
	if (marker2 in markerTable) {
	    return markerTable[marker2];
	}
	return '(unknown)';
    }

    static verifySig(arr) {
	const sig = this.signature();
	if (arr.length < sig.length) {
	    return false; // too short
	}
	for (let i = 0, n = sig.length; i < n; i++) {
	    if (arr[i] !== sig[i]) {
		return false; // different value found
	    }
	}
	return true; // completely matching
    }

    parse(arr) {
	this.data = arr;
	const chunkList = [];
	const arrLen = arr.length;
	let bo = 0; // bo: byteOffset(& baseOffset);
	while (bo < arrLen) {
	    const marker1 = arr[bo];
	    if (marker1 !== 0xFF) {
		console.debug('marker1(0xFF) scan skipping :' + marker1);
		bo++;
		continue;
	    }
	    const marker2 = arr[bo + 1];
	    let o = bo + 2;
	    const name = this.markerName(marker2);
	    const chunk = { name:name, marker2:marker2, offset:bo, bytes:null, infos:null };
	    const infos = [{ offset:bo, marker:name }];
	    switch (marker2) {
	    case 0xD8: case 0xD9: // SOI, EOI
		break;
	    case 0xDA: // SOS
	    case 0xD0: case 0xD1: case 0xD2: case 0xD3: // RST0 - RST3
            case 0xD4: case 0xD5: case 0xD6: case 0xD7: // RST4 - RST7
		for (; o < arrLen; o++) {
		    if (arr[o] === 0xFF) {
			if (arr[o + 1] != 0x00) {
			    break;
			}
			o++;
		    }
		}
		infos.push({ offset:bo + 2, nBytes:(o - bo) });
		break;
	    default: // APPx, SOFx, DQT, DHT, ...
		var len = this.binary.readUint16(arr, bo + 2); // Big endian
		infos.push({ offset:bo + 2, length:len });
		o += 2;
		switch (marker2) {
		case 0xE0: // APP0
		    var identifier = Utils.ToText(arr.subarray(o, o + 5));
		    infos.push({ offset:o, identifier:identifier });
		    o += 5;
		    if (identifier === 'JFIF\0') {
			const version = '' + arr[o] + '.' + arr[o + 1];
			infos.push({ offset:o, version:version });
			o += 2;
		    } else {
			const extensionCode = arr[o];
			const extentionData = arr.slice(o + 1, bo + 2 + len - (o + 1));
			const extensionDataStr = Utils.ToHexArray(extentionData).join(',');
			infos.push({ offset:o, extensionCode:extensionCode });
			infos.push({ offset:o + 1, extensionData:extensionDataStr });
			o = bo + 2 + len;
		    }
		    break;
		case 0xC0: case 0xC1: case 0xC2: case 0xC3: // SOF0 - SOF3
		case 0xC5: case 0xC6: case 0xC7:            // SOF5 - SOF7
		    var SOF_P = arr[o];
		    var SOF_Y = this.binary.readUint16(arr, o + 1);
		    var SOF_X = this.binary.readUint16(arr, o + 3);
		    var SOF_Nf = arr[o + 5];
		    infos.push({ offset:o,   P:SOF_P });
		    infos.push({ offset:o + 1, Y:SOF_Y });
		    infos.push({ offset:o + 3, X:SOF_X });
		    infos.push({ offset:o + 5, X:SOF_Nf });
		    o += 6;
		    for (var i = 0; i < SOF_Nf; i++) {
			const SOF_C = arr[o];
			const SOF_H = arr[o + 1] >> 4;
			const SOF_V = arr[o + 1] & 0x0F;
			const SOF_Tq = arr[o + 2];
			infos.push({ offset:o, C:SOF_C, H:SOF_H, V:SOF_V, Tq:SOF_Tq });
			o += 3;
		    }
		    break;
		case 0xDB: // DQT
		    var DQT_Pq = arr[o] >> 4;
		    var DQT_Tq = arr[o] & 0x0F;
		    infos.push({ offset:o, Pq:DQT_Pq, Tq:DQT_Tq });
		    o++;
		    if (DQT_Pq === 0) {
			var DQT_Q = arr.slice(o, o + 64);
			var DQT_Q_str = DQT_Q.map(function(n) { return n.toString(10); }).join(',');
			infos.push({ offset:o, Q:DQT_Q_str });
			o += 64;
		    } else {
			var DQT_Q = [];
			for (var i = 0; i < 64; i++) {
			    DQT_Q.push(this.binary.readUint16(arr, o + i * 2));
			}
			var DQT_Q_str = DQT_Q.map(function(n) { return n.toString(10); }).join(',');
			infos.push({ offset:o, Q:DQT_Q_str });
			o += 64 * 2;
		    }
		    break;
		case 0xC4: // DHT
		    var DHT_Tc = arr[o] >> 4;
		    var DHT_Th = arr[o] & 0x0F;
		    infos.push({ offset:o, Tc:DHT_Tc, Th:DHT_Th });
		    o++;
		    var DHT_L = arr.slice(o, o + 16);
		    var DHT_L_str = DHT_L.map(function(n) { return n.toString(10); }).join(',');
		    infos.push({ offset:o, L:DHT_L_str });
		    o += 16;
		    for (var i = 0; i < 16; i++) {
			const DHT_L_i = DHT_L[i];
			if (DHT_L_i > 0) {
			    const DHT_V = arr.slice(o, o + DHT_L_i);
			    const DHT_V_str = DHT_V.map(function(n) { return n.toString(10); }).join(',');
			    infos.push({ offset:o, Li:i, V:DHT_V_str });
			    o += DHT_L_i;
			}
		    }
		    break;
		default:
		}
		if (o !==  bo + 2 + len) {
		    infos.push({ offset:o, nBytes:(bo + 2 + len - o) });
		}
		o = bo + 2 + len;
		break;
	    }
	    const bytes = arr.subarray(bo, o);
	    bo = o;
	    chunk.bytes = bytes;
	    chunk.infos = infos;
	    chunkList.push(chunk);
	    if (marker2 === 0xD9) { // EOF
		break;
	    }
	}
	this.chunkList = chunkList;
    }

    getChunkList() {
	return this.chunkList;
    }

    build() {

    }

    getICC() {
	var iccIdx = 0; let iccCount = 0;
	const iccBlockList = [];
	let iccProfileSize = 0;
	for (const idx in this.chunkList) {
	    const chunk = this.chunkList[idx];
	    if (chunk.name === 'APP2') {
		const bytes = chunk.bytes;
		const iccpSig = String.fromCharCode.apply(null, bytes.subarray(4, 16));
		if (iccpSig === 'ICC_PROFILE\0') {
		    iccIdx++;
		    iccCount = bytes[17];
		    if (iccIdx === (bytes[16])) {
			var blockBytes = bytes.subarray(18);
			iccBlockList[iccIdx] = blockBytes;
			iccProfileSize += blockBytes.length;
		    }
		}
	    }
	}
	if (iccCount < 1) {
	    console.warn('iccCount < 1');
	    return null;
	}
	const iccProfileArr = new Uint8Array(iccProfileSize);
	let offset = 0;
	for (var iccIdx = 1; iccIdx <= iccCount; iccIdx++) {
	    if (iccIdx in iccBlockList) {
		var blockBytes = iccBlockList[iccIdx];
		iccProfileArr.set(blockBytes, offset);
		offset += blockBytes.length;
	    } else {
		console.error('insufficient iccIdx:' + iccIdx);
		return null;
	    }
	}
	return iccProfileArr;
    }
}
