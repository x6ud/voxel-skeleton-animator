#version 300 es

precision mediump float;

in vec4 a_position;
in vec2 a_texCoord;
in vec4 a_color;

out vec2 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = a_position;
}
