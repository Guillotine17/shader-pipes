const gl = document.createElement("canvas").getContext("webgl");
gl.canvas.width = 100;
gl.canvas.height = 100;
gl.viewport(0, 0, 100, 100);

const vsrc = `
void main() {
 gl_PointSize = 100.0;
 gl_Position = vec4(0, 0, 0, 1);
}
`;
const fsrc = `
precision mediump float;
uniform sampler2D u_image;

uniform sampler2D rampTexture;
uniform float rampWidth;
varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  vec2 st = gl_PointCoord;
  float mixValue = distance(st, vec2(0, 1));
  vec3 imageColor = vec3(texture2D(u_image, uv).rgb);
  float lum = 0.2126*imageColor.r + 0.7152*imageColor.g + 0.0722*imageColor.b;
  vec3 color = texture2D(
    rampTexture, 
    vec2((lum * (rampWidth - 1.) + .5) / rampWidth, 0.5)).rgb;
  gl_FragColor = vec4(color, 1);
}
`;

const programInfo = twgl.createProgramInfo(gl, [vsrc, fsrc]);
gl.useProgram(programInfo.program);

const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

function draw(gl, ramp, label) {
  const width = ramp.length;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const level = 0;
  const internalFormat = gl.RGB;
  const height = 1;
  const border = 0;
  const format = gl.RGB;
  const type = gl.UNSIGNED_BYTE;
  const rampData = new Uint8Array([].concat(...ramp).map(v => v * 255));
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                format, type, rampData);
  twgl.setUniforms(programInfo, {
    rampTexture: tex,
    rampWidth: width,
  });
  gl.drawArrays(gl.POINTS, 0, 1);
  const div = document.createElement("div");
  const img = new Image();
  img.src = gl.canvas.toDataURL();
  div.appendChild(img);
  const inner = document.createElement("span");
  inner.textContent = label;
  div.appendChild(inner);
  document.body.appendChild(div);
}

const color1 = [1.0, 0.55, 0];
const color2 = [0.226, 0.000, 0.615];
const r = [1, 0, 0];
const g = [0, 1, 0];
const b = [0, 0, 1];
const w = [1, 1, 1];

draw(gl, [color1, color2], "color1->color2");
draw(gl, [r, g], "red->green");
draw(gl, [r, g, b], "r->g->b");
draw(gl, [r, b, r, b, r], "r->b->r->b->r");
draw(gl, [g, b, b, b, g], "g->b->b->b->g");