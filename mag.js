"use strict";

function load_mag(ab, canvas) {
    var check = new Uint8Array(ab);
    if ('MAKI02  ' !== String.fromCharCode.apply(null, check.subarray(0, 8))) {
	throw new Error('MAG画像ではありません');
    }
    // ヘッダの先頭まで読み捨て
    for (var headerOffset = 30; check[headerOffset]; ++headerOffset)
	;
    var header = new DataView(ab, headerOffset, 32);
    var top = header.getUint8(0); // ヘッダの先頭
    var machine = header.getUint8(1); // 機種コード
    var flags = header.getUint8(2); // 機種依存フラグ
    var mode = header.getUint8(3); // スクリーンモード
    var sx = header.getUint16(4, true);
    var sy = header.getUint16(6, true);
    var ex = header.getUint16(8, true);
    var ey = header.getUint16(10, true);
    var flagAOffset = header.getUint32(12, true);
    var flagBOffset = header.getUint32(16, true);
    var flagASize = flagBOffset - flagAOffset;
    var flagBSize = header.getUint32(20, true);
    var pixelOffset = header.getUint32(24, true);
    var pixelSize = header.getUint32(28, true);
    var colors = mode & 0x80 ? 256 : 16;
    var pixelUnitLog = mode & 0x80 ? 1 : 2;
    var palette = new Uint8Array(ab, headerOffset + 32, colors * 3);
    var flagABuf = new Uint8Array(ab, headerOffset + flagAOffset, flagASize);
    var flagBBuf = new Uint8Array(ab, headerOffset + flagBOffset, flagBSize);
    var width = (ex & 0xFFF8 | 7) - (sx & 0xFFF8) + 1;
    var flagSize = width >>> (pixelUnitLog + 1);
    var height = ey - sy + 1;
    var flagBuf = new Uint8Array(flagSize);
    var pixel = new Uint8Array(ab, headerOffset + pixelOffset, pixelSize);
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.createImageData(width, height);
    var data = imageData.data;
    var flagAPos = 0;
    var flagBPos = 0;
    var src = 0;
    var dest = 0;
    // コピー位置の計算
    var copyx = [0, 1, 2, 4, 0, 1, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0];
    var copyy = [0, 0, 0, 0, 1, 1, 2, 2, 2, 4, 4, 4, 8, 8, 8, 16];
    var copypos = new Array(16);
    for (var i = 0; i < 16; ++i) {
	copypos[i] = -(copyy[i] * width + (copyx[i] << pixelUnitLog)) * 4;
    }
    var copysize = 4 << pixelUnitLog;
    var mask = 0x80;
    for (var y = 0; y < height; ++y) {
	// フラグを1ライン分展開
	for (var x = 0; x < flagSize; ++x) {
	    // フラグAを1ビット調べる
	    if (flagABuf[flagAPos] & mask) {
		// 1ならフラグBから1バイト読んでXORを取る
		flagBuf[x] ^= flagBBuf[flagBPos++];
	    }
	    if ((mask >>>= 1) === 0) {
		mask = 0x80;
		++flagAPos;
	    }
	}
	for (var x = 0; x < flagSize; ++x) {
	    // フラグを1つ調べる
	    var vv = flagBuf[x]
	    var v = vv >>> 4;
	    if (!v) {
		// 0ならピクセルデータから1ピクセル(2バイト)読む
		if (colors == 16) {
		    var c = (pixel[src] >>> 4) * 3;
		    data[dest] = palette[c + 1];
		    data[dest + 1] = palette[c];
		    data[dest + 2] = palette[c + 2];
		    data[dest + 3] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dest + 4] = palette[c + 1];
		    data[dest + 5] = palette[c];
		    data[dest + 6] = palette[c + 2];
		    data[dest + 7] = 0xFF;
		    c = (pixel[src] >>> 4) * 3;
		    data[dest + 8] = palette[c + 1];
		    data[dest + 9] = palette[c];
		    data[dest + 10] = palette[c + 2];
		    data[dest + 11] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dest + 12] = palette[c + 1];
		    data[dest + 13] = palette[c];
		    data[dest + 14] = palette[c + 2];
		    data[dest + 15] = 0xFF;
		    dest += 16;
		} else {
		    var c = pixel[src++] * 3;
		    data[dest] = palette[c + 1];
		    data[dest + 1] = palette[c];
		    data[dest + 2] = palette[c + 2];
		    data[dest + 3] = 0xFF;
		    c = pixel[src++] * 3;
		    data[dest + 4] = palette[c + 1];
		    data[dest + 5] = palette[c];
		    data[dest + 6] = palette[c + 2];
		    data[dest + 7] = 0xFF;
		    dest += 8;
		}
	    } else {
		// 0以外なら指定位置から1ピクセル(16色なら4ドット/256色なら2ドット)コピー
		var copySrc = dest + copypos[v];
		data.set(data.subarray(copySrc, copySrc + copysize), dest);
		dest += copysize;
	    }
	    v = vv & 0xF;
	    if (!v) {
		// 0ならピクセルデータから1ピクセル(2バイト)読む
		if (colors == 16) {
		    var c = (pixel[src] >>> 4) * 3;
		    data[dest] = palette[c + 1];
		    data[dest + 1] = palette[c];
		    data[dest + 2] = palette[c + 2];
		    data[dest + 3] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dest + 4] = palette[c + 1];
		    data[dest + 5] = palette[c];
		    data[dest + 6] = palette[c + 2];
		    data[dest + 7] = 0xFF;
		    c = (pixel[src] >>> 4) * 3;
		    data[dest + 8] = palette[c + 1];
		    data[dest + 9] = palette[c];
		    data[dest + 10] = palette[c + 2];
		    data[dest + 11] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dest + 12] = palette[c + 1];
		    data[dest + 13] = palette[c];
		    data[dest + 14] = palette[c + 2];
		    data[dest + 15] = 0xFF;
		    dest += 16;
		} else {
		    var c = pixel[src++] * 3;
		    data[dest] = palette[c + 1];
		    data[dest + 1] = palette[c];
		    data[dest + 2] = palette[c + 2];
		    data[dest + 3] = 0xFF;
		    c = pixel[src++] * 3;
		    data[dest + 4] = palette[c + 1];
		    data[dest + 5] = palette[c];
		    data[dest + 6] = palette[c + 2];
		    data[dest + 7] = 0xFF;
		    dest += 8;
		}
	    } else {
		// 0以外なら指定位置から1ピクセル(16色なら4ドット/256色なら2ドット)コピー
		var copySrc = dest + copypos[v];
		data.set(data.subarray(copySrc, copySrc + copysize), dest);
		dest += copysize;
	    }
	}
    }
    ctx.putImageData(imageData, 0, 0);
}

['dragenter', 'dragleave', 'dragover'].forEach(function(evname) {
    document.documentElement.addEventListener(evname, function nodrop(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    },  true);
});

document.body.addEventListener('drop', function(e) {
    [].forEach.call(e.dataTransfer.files, function(file) {
        var fr = new FileReader();
        fr.onload = function(ev) {
            document.body.insertBefore(document.createElement('hr'), document.body.firstChild);
            try {
                var canvas = document.createElement('canvas');
                load_mag(ev.target.result, canvas);
                document.body.insertBefore(canvas, document.body.firstChild);
            } catch (ex) {
                document.body.insertBefore(document.createTextNode(ex), document.body.firstChild);
            }
        };
        fr.readAsArrayBuffer(file);
    });
    e.preventDefault();
}, true);
