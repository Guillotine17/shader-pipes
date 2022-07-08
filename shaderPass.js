const {webglUtils} = require('./webglUtils')
const utils = require('./utils');
console.log(webglUtils);
function getPositionRectangle(x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    return [
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ];
}

class ShaderPass {
    constructor(gl, [vertexShader, fragmentShader], shape=[64, 64], target=null) {
        this.gl = gl;
        this.shape = shape;
        this.target = target;
        // this.programInfo = webglUtils.createProgramInfo(gl, [vertexShader, fragmentShader]);
        this.program = utils.createProgramFromSources(gl, [vertexShader, fragmentShader])
        console.log(this.program);

        this.uniformSetters = webglUtils.createUniformSetters(gl, this.program);
        this.attribSetters  = webglUtils.createAttributeSetters(gl, this.program);
        var arrays = {
            position: { numComponents: 2, data: getPositionRectangle(0, 0, shape[0], shape[1]), },
            texCoord: { numComponents: 2, data: [
                0.0, 0.0,
                1.0, 0.0,
                0.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                1.0, 1.0], },
            // normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
        };
        if (this.target){
            this.fb = this.gl.createFramebuffer();
        } else {
            this.fb = null;
        }
        
          
        this.bufferInfo = webglUtils.createBufferInfoFromArrays(this.gl, arrays);
    }

    initUniforms(uniforms) {
        // u_textureSize
        // u_resolution
        // u_image
        // u_texture
        // console.log(this.programInfo);
        this.uniforms = uniforms;
        webglUtils.setUniforms(this.uniformSetters, this.uniforms)
    }
    updateUniforms(newValues={}) {
        // this.gl.useProgram(this.program);
        this.uniforms = {...this.uniforms, ...newValues};
    }
    getUniforms() {
        return this.uniforms
    }
    draw() {
        // if (this.target && this.fb) {
        var gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
        // }
        gl.viewport(0, 0, this.shape[0], this.shape[1]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        webglUtils.setUniforms(this.uniformSetters, this.uniforms)
        webglUtils.setBuffersAndAttributes(gl, this.attribSetters, this.bufferInfo);
        console.log(this.bufferInfo)

        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
        // utils.bufferToFile(gl, this.shape[0], this.shape[1], `output/render_out${69}.ppm`)
    }
}

exports.ShaderPass = ShaderPass;