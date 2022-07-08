const utils = require('./utils')
const pixels = require('image-pixels')
const fs = require('fs');
const split = require('split');
const myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);

var message_count = 0;
var shape = {h: 64,w: 64 };
const fragShaderName = myArgs.length > 0 ? myArgs.at(0) : 'default';
let fragShader = utils.defaultFragSrc;
var gl = require('gl')(shape.w, shape.h, { preserveDrawingBuffer: true })

var renderProgram = utils.createProgramFromSources(gl, [utils.defaultVertexSrc, fragShader])
var texCoordLocation = gl.getAttribLocation(renderProgram, "a_texCoord");
var positionLocation = gl.getAttribLocation(renderProgram, "a_position");
var textureSizeLocation = gl.getUniformLocation(renderProgram, "u_textureSize");

// pass setup stuff
passfragShader = fs.readFileSync(`./shaders/fish_chrom.frag`);
let passProgram = utils.createProgramFromSources(gl, [utils.defaultVertexSrc, passfragShader])
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// end pass setup stuff

var inputTexture = gl.createTexture();
const passTexture = gl.createTexture();

function setup() {
    gl.bindTexture(gl.TEXTURE_2D, passTexture);
    
    // // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, null);

}

function passSetup(w, h){

    // attach the texture as the first color attachment

    gl.bindTexture(gl.TEXTURE_2D, passTexture);
 
    // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    w, h, border,
                    format, type, data);
    
    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, passTexture, level);
    passTexCoordLocation = gl.getAttribLocation(passProgram, "a_texCoord");
    passPositionLocation = gl.getAttribLocation(passProgram, "a_position");
    passTextureSizeLocation = gl.getUniformLocation(passProgram, "u_textureSize");
    passTextureLocation = gl.getUniformLocation(passProgram, "u_texture");
    gl.uniform1i(passTextureLocation, 0);

    
}
function setShape(w, h) {
    shape.w = w;
    shape.h = h;
    gl = require('gl')(w, h, { preserveDrawingBuffer: true })
    renderProgram = utils.createProgramFromSources(gl, [utils.defaultVertexSrc, fragShader])
    texCoordLocation = gl.getAttribLocation(renderProgram, "a_texCoord");
    positionLocation = gl.getAttribLocation(renderProgram, "a_position");
    textureSizeLocation = gl.getUniformLocation(renderProgram, "u_textureSize");
    passSetup(w, h);
    setup(w, h);
}
if (fragShaderName !== 'default') {
    fragShader = fs.readFileSync(`shaders/${fragShaderName}`, 'utf8')
}
async function main(imageData) {
    // const inputFile = myArgs.length ? myArgs.at(-1) :'./in.png'
    const {h , w} = shape;
    renderPass(imageData, w, h, fragShader)
    // renderOut(imageData, w, h, fragShader)
}
function renderPass(imageData, w, h, fragShader=utils.defaultFragSrc) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.useProgram(passProgram)
    var passPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, passPositionBuffer);
    setRectangle(gl, 0, 0, w, h);

    // provide texture coordinates for the rectangle.
    var passTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, passTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(passTexCoordLocation);
    gl.vertexAttribPointer(passTexCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Create a texture.

    gl.bindTexture(gl.texImage2D, inputTexture)
    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

    // lookup uniforms
    inputTextureLocation = gl.getUniformLocation(passProgram, "u_texture");
    gl.uniform1i(inputTextureLocation, 0);
    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, w, h);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our passProgram (pair of shaders)
    gl.useProgram(passProgram);

    // Turn on the position attribute
    gl.enableVertexAttribArray(passPositionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, passPositionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        passPositionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(passTexCoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, passTexCoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        passTexCoordLocation, size, type, normalize, stride, offset);

    // set the resolution
    var passResolutionLocation = gl.getUniformLocation(passProgram, "u_resolution");

    gl.uniform2f(passResolutionLocation, w, h);
    gl.uniform2f(passTextureSizeLocation, w, h);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);

    // utils.bufferToFile(gl, w, h, `output/render_out${message_count}.ppm`)
    utils.bufferToStdout(gl, w, h)
}
function renderOut(imageData, w, h, fragShader=utils.defaultFragSrc) {

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
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

    gl.bindTexture(gl.TEXTURE_2D, passTexture)
    // Upload the image into the texture.
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(renderProgram, "u_resolution");

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, w, h);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our renderProgram (pair of shaders)
    gl.useProgram(renderProgram);

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
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texCoordLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, w, h);
    gl.uniform2f(textureSizeLocation, w, h);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);

    // utils.bufferToFile(gl, w, h, `output/render_out${message_count}.ppm`)
    utils.bufferToStdout(gl, w, h)
}

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

async function createReader(){
    process.stdin.setEncoding(null)
    process.stdin.pipe(split('END_OF_MESSAGE')).on('data', processData)
    process.stdin.on('end', async (data) => {
        // console.log('end has happened' + data)
        // await createReader()
    })
    
    function processData(chunk) {
        message_count += 1;
        // console.log(message_count)
        if (chunk.charAt(0) === '{') {
            const message = JSON.parse(chunk);
            setShape(message.width, message.height)
            process.stdout.write(chunk + "\n")
            return
        }
        // if (chunk.charAt(0) === 'E') {
        //     console.log('maybe end of message in chunk')
        // }
        // console.log(chunk);
        // let data = enc.encode(chunk)
        // for (var i = 0; i < buffer.length; i++) {
        //     myBuffer.push(buffer[i]);
        // }
        // console.log(myBuffer)

        // data =  new Uint8Array(chunk.trim())
        pixels(Buffer.from(chunk, 'base64'), { shape: [shape.w, shape.h]}).then((ImageData) => {
            if (message_count == 3) {
                // console.log(ImageData)
            }
            main(ImageData)
        })
        // main({data: pixels(chunk, { shape: [w, h]}), height: shape.h, width: shape.w}).then((data) => {
        //     console.log('done')
        // })
    }
}

createReader()