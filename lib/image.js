
// https://stackoverflow.com/questions/23497925/how-can-i-stop-the-alpha-premultiplication-with-canvas-imagedata

function loadImageData(src, callback) {
    let image = new Image();
    image.addEventListener('load', function () {
        const width = this.width, height = this.height;
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext("webgl2");
        const texture = gl.createTexture();
        const framebuffer = gl.createFramebuffer();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                gl.TEXTURE_2D, texture, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                      this);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        const imageData = new ImageData(width, height);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE,
                      imageData.data);
        callback(imageData);
    });
    image.src = src;
}

function multipliedImageData(imageData) {
    const { width, height, data } = imageData;
    const mImageData = new ImageData(width, height);
    const d = mImageData.data;
    const size = 4 * width * height;
    for (let i = 0 ; i < size;  i += 4) {
        const [r, g, b, a] = data.subarray(i, i + 4);
        d[i]   = r * a/255;
        d[i+1] = g * a/255;
        d[i+2] = b * a/255;
        d[i+3] = a;
    }
    return mImageData;
}
