
// https://stackoverflow.com/questions/23497925/how-can-i-stop-the-alpha-premultiplication-with-canvas-imagedata

function loadImageData(src, callback) {
    let image = new Image();
    image.addEventListener('load', function () {
        let canvas = document.createElement('canvas');
        let gl = canvas.getContext("webgl2");
        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        let imageData = new ImageData(this.width, this.height);
        let data = imageData.data;
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        callback(imageData);
    });
    image.src = src;
}

