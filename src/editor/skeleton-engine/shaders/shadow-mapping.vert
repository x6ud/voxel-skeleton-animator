#version 300 es

precision mediump float;

in vec3 a_position;
in vec4 a_color;
in vec3 a_normal;

uniform mat4 u_pvMatrix;
uniform mat4 u_mMatrix;
uniform mat4 u_mMatrix2;
uniform mat4 u_projectionTextureMatrix;

out vec4 v_color;
out vec4 v_projectedTexcoord;
out float v_z;

void main() {
    vec4 worldPosition = u_mMatrix2 * u_mMatrix * vec4(a_position, 1.0);
    gl_Position = u_pvMatrix * worldPosition;
    v_color = a_color;
    v_projectedTexcoord = u_projectionTextureMatrix * worldPosition;
    v_z = worldPosition.z;
}
