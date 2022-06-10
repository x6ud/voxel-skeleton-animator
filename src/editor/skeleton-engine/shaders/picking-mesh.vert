#version 300 es

precision mediump float;

in vec3 a_position;
in vec4 a_type;
in vec4 a_id;

uniform mat4 u_pvMatrix;
uniform mat4 u_mMatrix;

out vec4 v_type;
out vec4 v_id;

void main() {
    gl_Position = u_pvMatrix * u_mMatrix * vec4(a_position, 1.0);
    v_type = a_type;
    v_id = a_id;
}
