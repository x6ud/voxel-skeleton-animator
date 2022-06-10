#version 300 es

precision mediump float;

uniform vec4 u_type;
uniform vec4 u_id;

layout(location = 0) out vec4 outType;
layout(location = 1) out vec4 outId;

void main() {
    outType = u_type;
    outId = u_id;
}
