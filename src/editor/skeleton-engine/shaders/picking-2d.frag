#version 300 es

precision mediump float;

in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec4 u_type;
uniform vec4 u_id;

layout(location = 0) out vec4 outType;
layout(location = 1) out vec4 outId;

void main() {
    if (texture(u_texture, v_texCoord).a == 0.0){
        discard;
    } else {
        outType = u_type;
        outId = u_id;
    }
}
