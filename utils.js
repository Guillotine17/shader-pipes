const fs = require('fs')
const im = require('imagemagick')
const { getBytesPerElementForInternalFormat } = require('twgl.js')

module.exports.defaultVertexSrc = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(clipSpace, 0, 1);
   //  gl_Position = a_position;

   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points.
   v_texCoord = a_texCoord;
}
`
module.exports.defaultFragSrc = `
precision mediump float;
 
// our texture
uniform sampler2D u_image;
 
// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;
 
void main() {
   // Look up a color from the texture.
   gl_FragColor = texture2D(u_image, v_texCoord);
}
`

async function getDimensions(imagePath) {
    return new Promise((resolve, reject) => {
        im.identify(['-format', '%wx%h', imagePath], function(err, output){
            if (err) throw err;
            // console.log('dimension: '+output);
            resolve(output.split('x').map((input => parseInt(input))))
        });
    })
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

function bufferToStdout (gl, width, height) {
  // Write output
  const pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  // process.stdout.write(['P3\n# gl.ppm\n', width, ' ', height, '\n255\n'].join(''))
  process.stdout.write(Buffer.from(pixels).toString('base64') + '\n');
}

function bufferToFile (gl, width, height, filename) {
  const file = fs.createWriteStream(filename)

  // Write output
  const pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  file.write(['P3\n# gl.ppm\n', width, ' ', height, '\n255\n'].join(''))
  for (let i = 0; i < pixels.length; i += 4) {
    file.write(pixels[i] + ' ' + pixels[i + 1] + ' ' + pixels[i + 2] + ' ')
  }
  file.close(() => {
      const newFile = filename.replace('.ppm', '.png')
      // console.log(newFile)
      im.convert([filename, newFile])
  })
}

function imageDataToFile (data, width, height, filename) {
  return new Promise((resolve, reject) => {

    const file = fs.createWriteStream(filename)
  
    // Write output
    const pixels = data.data
    file.write(['P3\n# gl.ppm\n', width, ' ', height, '\n255\n'].join(''))
    for (let i = 0; i < pixels.length; i += 4) {
      file.write(pixels[i] + ' ' + pixels[i + 1] + ' ' + pixels[i + 2] + ' ')
    }
    file.close(() => {
        const newFile = filename.replace('.ppm', '.png')
        // console.log(newFile)
        im.convert([filename, newFile])
        resolve('done')
    })
  })

}

function drawTriangle (gl) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-2, -2, -2, 4, 4, -2]), gl.STREAM_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.disableVertexAttribArray(0)
  gl.deleteBuffer(buffer)
}

function loadShader (gl, shaderSource, shaderType) {
  const shader = gl.createShader(shaderType)
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)

  // Check the compile status
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (!compiled) {
    // Something went wrong during compilation; get the error
    const lastError = gl.getShaderInfoLog(shader)
    console.log("*** Error compiling shader '" + shader + "':" + lastError)
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram (gl, shaders, optAttribs, optLocations) {
  const program = gl.createProgram()
  shaders.forEach(function (shader) {
    gl.attachShader(program, shader)
  })
  if (optAttribs) {
    optAttribs.forEach(function (attrib, ndx) {
      gl.bindAttribLocation(
        program,
        optLocations ? optLocations[ndx] : ndx,
        attrib)
    })
  }
  gl.linkProgram(program)

  // Check the link status
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!linked) {
    // something went wrong with the link
    const lastError = gl.getProgramInfoLog(program)
    console.log('Error in program linking:' + lastError)

    gl.deleteProgram(program)
    return null
  }
  return program
}

function createProgramFromSources (gl, shaderSources, optAttribs, optLocations) {
  const defaultShaderType = [
    'VERTEX_SHADER',
    'FRAGMENT_SHADER'
  ]

  const shaders = []
  for (let ii = 0; ii < shaderSources.length; ++ii) {
    shaders.push(loadShader(gl, shaderSources[ii], gl[defaultShaderType[ii]]))
  }
  return createProgram(gl, shaders, optAttribs, optLocations)
}
module.exports.imageDataToFile = imageDataToFile
module.exports.getDimensions = getDimensions
module.exports.bufferToStdout = bufferToStdout
module.exports.setRectangle = setRectangle
module.exports.bufferToFile = bufferToFile
module.exports.drawTriangle = drawTriangle
module.exports.loadShader = loadShader
module.exports.createProgram = createProgram
module.exports.createProgramFromSources = createProgramFromSources