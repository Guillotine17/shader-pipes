precision mediump float;

precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_textureSize;

uniform sampler2D u_rampTexture;
uniform float u_rampWidth;
varying vec2 v_texCoord;

void main() {
  vec2 uv = v_texCoord;
  vec2 st = gl_PointCoord;
  float mixValue = distance(st, vec2(0, 1));
  vec3 imageColor = vec3(texture2D(u_image, uv).rgb);
  float lum = 0.2126*imageColor.r + 0.7152*imageColor.g + 0.0722*imageColor.b;

  vec3 color = texture2D(
    u_rampTexture, 
    uv).rgb;
    // vec2((lum * (u_rampWidth - 1.) + .5) / u_rampWidth, 0.5)).rgb;
    // vec2(0.7, 0.5)).rgb;
    // vec2(0.5*uv.x, 0.5)).rgb;
    // vec2(uv.x, 1)).rgb;
//   color = texture2D(u_image, uv).rgb;
//   color = vec3(lum, lum, lum);
  gl_FragColor = vec4(color, 1);
}