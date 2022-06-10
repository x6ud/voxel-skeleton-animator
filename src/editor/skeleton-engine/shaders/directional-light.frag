#version 300 es

precision mediump float;

in vec4 v_color;
in vec3 v_normal;

uniform vec4 u_color;
uniform vec3 u_lightDirection;
uniform float u_minBrightness;
uniform float u_incBrightness;

out vec4 outColor;

void main() {
    outColor = v_color * u_color;
    float light = dot(v_normal, -normalize(u_lightDirection));
    outColor.rgb *= min(1.0, max(u_minBrightness, light + u_incBrightness));
}