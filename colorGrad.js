const utils = require('./utils')
const pixels = require('image-pixels')
const fs = require('fs')
const myArgs = process.argv.slice(2);
const twgl = require('twgl.js')
console.log('myArgs: ', myArgs);

async function main() {
    const inputFile = myArgs.length ? myArgs.at(-1) :'./in.png'
    const fragShaderName = 'colorGrad.frag';
    let fragShader = utils.defaultFragSrc;
    if (fragShaderName !== 'default') {
        fragShader = fs.readFileSync(`shaders/${fragShaderName}`, 'utf8')
    }
    const [w, h] = await utils.getDimensions(inputFile)
    console.log(`${w}, ${h}`)
    const imageData = await pixels(inputFile)
    render2(imageData, w, h, fragShader)
    // image.onload = function() {
    //   render(image);
    // }
}

function render2(imageData, w, h, fragShader=utils.defaultFragSrc) {
    ////// ramp bullshit
    const r = [1, 0, 0];
    const g = [1, 0, 1];
    const b = [1, 1, 1];
    // const w = [1, 1, 1];
    const ramp = [g, b, b, b, g];
    const rampData = new Uint8Array([].concat(...ramp).map(v => v * 255));
    const rampWidth = ramp.length;

    var gl = require('gl')(w, h, { preserveDrawingBuffer: true })

    program = utils.createProgramFromSources(gl, [utils.defaultVertexSrc, fragShader])
    var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, 0, 0, w, h);

    // provide texture coordinates for the rectangle.
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Create a texture.
    // gl.activeTexture(gl.TEXTURE0);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    var imageTextureLocation = gl.getUniformLocation(program, "u_image");
    gl.uniform1i(imageTextureLocation, 0);  // texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // gl.activeTexture(gl.TEXTURE1);
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    var rampWitdthLocation = gl.getUniformLocation(program, "u_rampWidth");
    gl.uniform1f(rampWitdthLocation, rampWidth)
    var rampTextureLocation = gl.getUniformLocation(program, "u_rampTexture");
    gl.uniform1i(rampTextureLocation, 1);  // texture unit 1

    // gl.activeTexture(gl.TEXTURE1);
    // gl.bindTexture(gl.TEXTURE_2D, tex);
    const level = 0;
    const internalFormat = gl.RGB;
    const height = 1;
    const border = 0;
    const format = gl.RGB;
    type = gl.UNSIGNED_BYTE;
    utils.imageDataToFile(rampData, rampWidth, 1, "ramp.ppm")
    console.log(rampWidth)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, rampWidth, height, border,
                    format, gl.UNSIGNED_BYTE, rampData);
        /////////////
    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, w, h);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texCoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(
        texCoordLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, w, h);
    gl.uniform2f(textureSizeLocation, w, h);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.drawArrays(primitiveType, offset, count);

    utils.bufferToFile(gl, w, h, 'render_out.ppm')
}

// function draw(gl, ramp, label) {
//     const width = ramp.length;
//     gl.bindTexture(gl.TEXTURE_2D, tex);
//     const level = 0;
//     const internalFormat = gl.RGB;
//     const height = 1;
//     const border = 0;
//     const format = gl.RGB;
//     const type = gl.UNSIGNED_BYTE;
//     const rampData = new Uint8Array([].concat(...ramp).map(v => v * 255));
//     gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
//                   format, type, rampData);
//     twgl.setUniforms(programInfo, {
//       rampTexture: tex,
//       rampWidth: width,
//     });
//     gl.drawArrays(gl.POINTS, 0, 1);
//     const div = document.createElement("div");
//     const img = new Image();
//     img.src = gl.canvas.toDataURL();
//     div.appendChild(img);
//     const inner = document.createElement("span");
//     inner.textContent = label;
//     div.appendChild(inner);
//     document.body.appendChild(div);
//   }
function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}
main()