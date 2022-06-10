#version 300 es

precision mediump float;

in vec4 v_type;
in vec4 v_id;

layout(location = 0) out vec4 outType;
layout(location = 1) out vec4 outId;

void main() {
    outType = v_type;
    outId = v_id;
}