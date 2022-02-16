const utils = require('./utils')
var im = require('imagemagick');


const outputFileName = 'out'
// Create context
var width   = 64
var height  = 64
var gl = require('gl')(width, height, { preserveDrawingBuffer: true })

//Clear screen to red
gl.clearColor(1, 1, 0, 1)
gl.clear(gl.COLOR_BUFFER_BIT)

//Write output as a PPM formatted image
var pixels = new Uint8Array(width * height * 4)
gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
utils.bufferToFile(gl, width, height, `${outputFileName}.ppm`)

im.convert([`${outputFileName}.ppm`, `${outputFileName}.png`])
