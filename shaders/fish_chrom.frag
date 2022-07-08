precision mediump float;
 
// our texture
uniform sampler2D u_texture;
uniform vec2 u_textureSize;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;


void main()
{
    // uv (0 to 1)
    vec2 uv = v_texCoord;
    // gl_FragColor = vec4(v_texCoord.x, v_texCoord.y, 0.0, 1.0);
    // uv (-1 to 1, 0 - center)
    uv.x = 2. * uv.x - 1.;
    uv.y = 2. * uv.y - 1.;
    
    float barrel_power = 1.15; // increase for BIGGER EYE!
    float theta = atan(uv.y, uv.x);
	float radius = length(uv);
	radius = pow(radius, barrel_power);
	uv.x = radius * cos(theta);
	uv.y = radius * sin(theta);
    
    // uv (0 to 1)
    uv.x = 0.5 * (uv.x + 1.);
    uv.y = 0.5 * (uv.y + 1.);

    float chromo_x = 0.2;
    float chromo_y = 0.2;
    // output
    gl_FragColor = vec4(texture2D(u_texture, vec2(uv.x - chromo_x*0.016, uv.y - chromo_y*0.009)).r, texture2D(u_texture, vec2(uv.x + chromo_x*0.0125, uv.y - chromo_y*0.004)).g, texture2D(u_texture, vec2(uv.x - chromo_x*0.0045, uv.y + chromo_y*0.0085)).b, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
