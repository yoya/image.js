"use strict";

function load_mag(ab, canvas) {
    const check = new Uint8Array(ab);
    if ('MAKI02  ' !== String.fromCharCode.apply(null, check.subarray(0, 8))) {
	return 'MAG画像ではありません';
    }
    // ヘッダの先頭まで読み捨て
    let headerOffset = 30;
    while (check[headerOffset]) {
        ++headerOffset;
    }
    const header = new DataView(ab, headerOffset, 32);
    const top = header.getUint8(0); // ヘッダの先頭
    const machine = header.getUint8(1); // 機種コード
    const flags = header.getUint8(2); // 機種依存フラグ
    const mode = header.getUint8(3); // スクリーンモード
    const sx = header.getUint16(4, true);
    const sy = header.getUint16(6, true);
    const ex = header.getUint16(8, true);
    const ey = header.getUint16(10, true);
    const flagAOffset = header.getUint32(12, true);
    const flagBOffset = header.getUint32(16, true);
    const flagASize = flagBOffset - flagAOffset;
    const flagBSize = header.getUint32(20, true);
    const pixelOffset = header.getUint32(24, true);
    const pixelSize = header.getUint32(28, true);
    const colors = mode & 0x80 ? 256 : 16;
    const pixelUnitLog = mode & 0x80 ? 1 : 2;
    const palette = new Uint8Array(ab, headerOffset + 32, colors * 3);
    const flagABuf = new Uint8Array(ab, headerOffset + flagAOffset, flagASize);
    const flagBBuf = new Uint8Array(ab, headerOffset + flagBOffset, flagBSize);
    const width = (ex & 0xFFF8 | 7) - (sx & 0xFFF8) + 1;
    const flagSize = width >>> (pixelUnitLog + 1);
    const height = ey - sy + 1;
    const flagBuf = new Uint8Array(flagSize);
    const pixel = new Uint8Array(ab, headerOffset + pixelOffset, pixelSize);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    let flagAPos = 0;
    let flagBPos = 0;
    let src = 0;
    let dst = 0;
    // コピー位置の計算
    const copyx = [0, 1, 2, 4, 0, 1, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0];
    const copyy = [0, 0, 0, 0, 1, 1, 2, 2, 2, 4, 4, 4, 8, 8, 8, 16];
    const copypos = new Int32Array(16);
    for (let i = 0; i < 16; ++i) {
	copypos[i] = -(copyy[i] * width + (copyx[i] << pixelUnitLog)) * 4;
    }
    const copysize = 4 << pixelUnitLog;
    let mask = 0x80;
    for (let y = 0; y < height; ++y) {
	// フラグを1ライン分展開
	for (let x = 0; x < flagSize; ++x) {
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
	for (let x = 0; x < flagSize; ++x) {
	    // フラグを1つ調べる
	    const vv = flagBuf[x]
	    let v = vv >>> 4;
	    if (!v) {
		// 0ならピクセルデータから1ピクセル(2バイト)読む
		if (colors == 16) {
		    let c = (pixel[src] >>> 4) * 3;
		    data[dst] = palette[c + 1];
		    data[dst + 1] = palette[c];
		    data[dst + 2] = palette[c + 2];
		    data[dst + 3] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dst + 4] = palette[c + 1];
		    data[dst + 5] = palette[c];
		    data[dst + 6] = palette[c + 2];
		    data[dst + 7] = 0xFF;
		    c = (pixel[src] >>> 4) * 3;
		    data[dst + 8] = palette[c + 1];
		    data[dst + 9] = palette[c];
		    data[dst + 10] = palette[c + 2];
		    data[dst + 11] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dst + 12] = palette[c + 1];
		    data[dst + 13] = palette[c];
		    data[dst + 14] = palette[c + 2];
		    data[dst + 15] = 0xFF;
		    dst += 16;
		} else {
		    const c = pixel[src++] * 3;
		    data[dst] = palette[c + 1];
		    data[dst + 1] = palette[c];
		    data[dst + 2] = palette[c + 2];
		    data[dst + 3] = 0xFF;
		    c = pixel[src++] * 3;
		    data[dst + 4] = palette[c + 1];
		    data[dst + 5] = palette[c];
		    data[dst + 6] = palette[c + 2];
		    data[dst + 7] = 0xFF;
		    dst += 8;
		}
	    } else {
		// 0以外なら指定位置から1ピクセル(16色なら4ドット/256色なら2ドット)コピー
		const copySrc = dst + copypos[v];
		data.set(data.subarray(copySrc, copySrc + copysize), dst);
		dst += copysize;
	    }
	    v = vv & 0xF;
	    if (!v) {
		// 0ならピクセルデータから1ピクセル(2バイト)読む
		if (colors == 16) {
		    let c = (pixel[src] >>> 4) * 3;
		    data[dst] = palette[c + 1];
		    data[dst + 1] = palette[c];
		    data[dst + 2] = palette[c + 2];
		    data[dst + 3] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dst + 4] = palette[c + 1];
		    data[dst + 5] = palette[c];
		    data[dst + 6] = palette[c + 2];
		    data[dst + 7] = 0xFF;
		    c = (pixel[src] >>> 4) * 3;
		    data[dst + 8] = palette[c + 1];
		    data[dst + 9] = palette[c];
		    data[dst + 10] = palette[c + 2];
		    data[dst + 11] = 0xFF;
		    c = (pixel[src++] & 0xF) * 3;
		    data[dst + 12] = palette[c + 1];
		    data[dst + 13] = palette[c];
		    data[dst + 14] = palette[c + 2];
		    data[dst + 15] = 0xFF;
		    dst += 16;
		} else {
		    let c = pixel[src++] * 3;
		    data[dst] = palette[c + 1];
		    data[dst + 1] = palette[c];
		    data[dst + 2] = palette[c + 2];
		    data[dst + 3] = 0xFF;
		    c = pixel[src++] * 3;
		    data[dst + 4] = palette[c + 1];
		    data[dst + 5] = palette[c];
		    data[dst + 6] = palette[c + 2];
		    data[dst + 7] = 0xFF;
		    dst += 8;
		}
	    } else {
		// 0以外なら指定位置から1ピクセル(16色なら4ドット/256色なら2ドット)コピー
		const copySrc = dst + copypos[v];
		data.set(data.subarray(copySrc, copySrc + copysize), dst);
		dst += copysize;
	    }
	}
    }
    ctx.putImageData(imageData, 0, 0);
    return "";
}

['dragenter', 'dragleave', 'dragover'].forEach(function(evname) {
    document.documentElement.addEventListener(evname, ev => {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    }, true);
});

document.body.addEventListener('drop', function(e) {
    e.preventDefault();
    const hr = document.createElement('hr');
    const br = document.createElement('br');
    const first = document.body.firstElementChild;;
    document.body.insertBefore(hr, first.nextSibling);
    Array.from(e.dataTransfer.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const div = document.createElement('div');
            document.body.insertBefore(div, hr.nextSibling);
            const canvas = document.createElement('canvas');
            const ret = load_mag(ev.target.result, canvas);
            if (ret === "") {
                div.appendChild(canvas)
            } else {
                const errtext = document.createTextNode(ret);
                div.appendChild(errtext);
            }
            div.className = "hovertext";
            div.dataset.hover = file.name;
            document.body.insertBefore(br, hr.nextSibling);
        };
        reader.readAsArrayBuffer(file);
        return false;
     });
}, true);
