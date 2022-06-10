#version 300 es

precision mediump float;

in vec3 a_position;
in vec4 a_color;

uniform mat4 u_pvMatrix;
uniform mat4 u_mMatrix;
uniform float u_zBias;

out vec4 v_color;

void main() {
    gl_Position = u_pvMatrix * u_mMatrix * vec4(a_position, 1.0);
    gl_Position.z -= u_zBias;
    v_color = a_color;
}
