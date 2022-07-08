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

var program = utils.createProgramFromSources(gl, [utils.defaultVertexSrc, fragShader])
var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
var positionLocation = gl.getAttribLocation(program, "a_position");
var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
if (fragShaderName !== 'default') {
    fragShader = fs.readFileSync(`shaders/${fragShaderName}`, 'utf8')
}
function setShape(w, h) {
    shape.w = w;
    shape.h = h;
    gl = require('gl')(w, h, { preserveDrawingBuffer: true })
    program = utils.createProgramFromSources(gl, [utils.defaultVertexSrc, fragShader])
    texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    positionLocation = gl.getAttribLocation(program, "a_position");
    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
}
async function main(imageData) {
    // const inputFile = myArgs.length ? myArgs.at(-1) :'./in.png'
    const {h , w} = shape;
    render2(imageData, w, h, fragShader)
}

function render2(imageData, w, h, fragShader=utils.defaultFragSrc) {


    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    utils.setRectangle(gl, 0, 0, w, h);

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
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    var texture_location = gl.getUniformLocation(program, "u_texture");
    // gl.uniform1i(resolutionLocation, w, h);


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