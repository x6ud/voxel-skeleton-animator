#version 300 es

precision mediump float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;
uniform sampler2D u_depth;
uniform float u_threshold;

out vec4 outColor;

vec4 getPixel(sampler2D texture, int dx, int dy) {
    ivec2 texSize = textureSize(texture, 0);
    ivec2 pos = ivec2(v_texCoord.xy * vec2(texSize.xy));
    int x = max(0, min(texSize.x - 1, pos.x + dx));
    int y = max(0, min(texSize.y - 1, pos.y + dy));
    return texelFetch(texture, ivec2(x, y), 0);
}

void main() {
    float deep = texture(u_depth, v_texCoord).x;
    vec4 color = texture(u_texture, v_texCoord);
    if (
    deep - getPixel(u_depth, -1, 0).x > u_threshold && getPixel(u_texture, -1, 0).a == 1.0
    || deep - getPixel(u_depth, 1, 0).x > u_threshold && getPixel(u_texture, 1, 0).a == 1.0
    || deep - getPixel(u_depth, 0, -1).x > u_threshold && getPixel(u_texture, 0, -1).a == 1.0
    || deep - getPixel(u_depth, 0, 1).x > u_threshold && getPixel(u_texture, 0, 1).a == 1.0
    ) {
        if (color.a == 0.0) {
            outColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            outColor = color * 0.25;
        }
    } else {
        outColor = color;
    }
}
