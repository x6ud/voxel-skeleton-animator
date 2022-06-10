#version 300 es

precision mediump float;

in vec4 v_color;
in vec4 v_projectedTexcoord;
in float v_z;

uniform sampler2D u_projectedTexture;

out vec4 outColor;

const float zBias = 0.0002;

void main() {
    outColor = v_color;
    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    bool inRange =
    projectedTexcoord.x >= 0.0 &&
    projectedTexcoord.x <= 1.0 &&
    projectedTexcoord.y >= 0.0 &&
    projectedTexcoord.y <= 1.0;
    float shadowDepth = texture(u_projectedTexture, projectedTexcoord.xy).r;
    if (inRange && projectedTexcoord.z - zBias > shadowDepth || v_z < 0.0) {
        outColor.rgb *= 0.7;
    }
}
