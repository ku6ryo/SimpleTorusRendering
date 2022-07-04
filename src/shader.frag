precision mediump float;

uniform mat4 uMiMatrix;

varying vec3 vNormal;

vec3 dLight = vec3(0., 0., 1.);

void main() {
  vec3 invLight = normalize(uMiMatrix * (vec4(dLight, 0.))).xyz;
  float diffuse = max(dot(vNormal, invLight), 0.0);
  gl_FragColor = vec4(vec3(diffuse, 0, 0) + vec3(0.1, 0.1, 0.1), 1.);
}