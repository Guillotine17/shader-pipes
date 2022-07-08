const utils = require('./utils')
const pixels = require('image-pixels')
const fs = require('fs');
const split = require('split');
const { ShaderPass } = require('./shaderPass');
const myArgs = process.argv.slice(2);
var gl = null;
let shaderPass0 = null;
var shape = {w: 64, h: 64};
var fragShader = null
const fragShaderName = myArgs.length > 0 ? myArgs.at(0) : 'default';
if (fragShaderName !== 'default') {
    fragShader = fs.readFileSync(`shaders/${fragShaderName}`, 'utf8')
}
function createTexture(gl, type) {
    var texture = gl.createTexture();
    if (type == 'image') {
        gl.bindTexture(gl.TEXTURE_2D, texture);
    
        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    return texture;
}
function setup(w, h) {
    shape.w = w;
    shape.h = h;
    gl = require('gl')(w, h, { preserveDrawingBuffer: true })
    // program = utils.createProgramFromSources(gl, [utils.defaultVertexSrc, fragShader])
    shaderPass0 = new ShaderPass(gl,  [utils.defaultVertexSrc, fragShader], [w, h], null)
    const uniforms0 = {
        u_resolution: [w, h],
        u_textureSize: [w, h],
        u_texture: createTexture(gl, 'image')
    }
    shaderPass0.initUniforms(uniforms0);
}
function render(imageData) {
    gl.bindTexture(gl.TEXTURE_2D, shaderPass0.getUniforms().u_texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    shaderPass0.draw();
    utils.bufferToFile(gl, shape.w, shape.h, `output/render_out${69}.ppm`)
}
async function createReader(){
    // process.stdin.setEncoding(null)
    // process.stdin.pipe(split('END_OF_MESSAGE')).on('data', processData)
    // process.stdin.on('end', async (data) => {
    //     // console.log('end has happened' + data)
    //     // await createReader()
    // })
    
        // message_count += 1;
        // console.log(message_count)
        // if (chunk.charAt(0) === '{') {
        //     const message = JSON.parse(chunk);
        //     setup(message.width, message.height)
        //     process.stdout.write(chunk + "\n")
        //     return
        // }
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
        pixels('pipe_input.png').then((imageData) => {

            setup(imageData.height, imageData.width);
            render(imageData)
        })
        // main({data: pixels(chunk, { shape: [w, h]}), height: shape.h, width: shape.w}).then((data) => {
        //     console.log('done')
        // })
}

createReader()