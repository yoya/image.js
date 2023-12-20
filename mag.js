"use strict";
/*
 * original code: http://emk.name/2015/03/magjs.html
 */

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

const CanvasList = [];

['dragenter', 'dragleave', 'dragover'].forEach(function(evname) {
    document.documentElement.addEventListener(evname, ev => {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    }, true);
});

function resolve_download_canvas(canvas) {
    return new Promise(resolve => {
        canvas.toBlob(blob => {  // PNG download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = canvas.dataset.filename + ".png";
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                resolve();
            }, 1000);
        }, "image/png");
    });
}

async function download_canvas(canvas) {
    await resolve_download_canvas(canvas);
}

function download_hook(canvas) {
    canvas.addEventListener('click', e => {
        download_canvas(canvas);
    });
}

function hover_hook(canvas) {
    const parent = canvas.parentNode;
    const textDiv = document.createElement('hr');
    parent.appendChild(textDiv)
    textDiv.innerText = canvas.dataset.filename;
    textDiv.className = "hoverText";
    textDiv.style.display = "none";
    canvas.addEventListener('mouseenter', e => {
        textDiv.style.display = "block";
    });
    canvas.addEventListener('mousemove', e => {
        const { offsetX, offsetY } = e;
        textDiv.style.left = String(offsetX) + "px";
        textDiv.style.top = String(offsetY) + "px";
    });
    canvas.addEventListener('mouseleave', e => {
        textDiv.style.display = "none";
    });
}

scaleSelect.addEventListener('change', e => {
    const scale = Number(scaleSelect.value) / 100;
    CanvasList.forEach(canvas => {
        canvas.style.width = (canvas.width * scale) | 0;
    });
});

downloadButton.addEventListener('click', e => {
    CanvasList.forEach(async canvas => {
        await download_canvas(canvas);
    });
});

document.body.addEventListener('drop', e => {
    console.log("drop");
    e.preventDefault();
    const hr = document.createElement('hr');
    const first = document.body.firstElementChild;;
    Array.from(e.dataTransfer.files).forEach(file => {
        const div = document.createElement('div');
        div.style = "float:left;  position: relative;";
        container.appendChild(div);
        const reader = new FileReader();
        reader.onload = function(ev) {
            const canvas = document.createElement('canvas');
            const ret = load_mag(ev.target.result, canvas);
            if (ret === "") {
                canvas.dataset.filename = file.name;
                div.appendChild(canvas)
                download_hook(canvas);
                hover_hook(canvas, file);
                const scale = Number(scaleSelect.value) / 100;
                canvas.style.width = (canvas.width * scale) | 0;
                CanvasList.push(canvas);
            } else {
                const errtext = document.createTextNode(ret+"("+file.name+")");
                div.appendChild(errtext);
            }
        };
        reader.readAsArrayBuffer(file);
        return false;
    });
}, true);
