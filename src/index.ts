import { mat4, vec3 } from "gl-matrix"
import vertexShader from "./shader.vert?raw"
import fragmentShader from "./shader.frag?raw"
import { createShader, createProgram } from "./shader"
import { createTorus } from "./createTorus"

export async function main() {

  /*
  const {
    positions,
    triangles,
  } = createBox()
  */
  const {
    positions,
    triangles,
  } = createTorus(1, 0.2, 50, 50)

  const width = 600
  const height = 400
  const fov = Math.PI / 4
  const aspect = width / height
  const near = 0.1
  const far = 100

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  document.body.appendChild(canvas)
  const gl = canvas.getContext("webgl")!

  const projectionMatrix = mat4.perspective(
    mat4.identity(mat4.create()),
    fov,
    aspect,
    near,
    far,
  )
  const viewMatrix = mat4.lookAt(
    mat4.identity(mat4.create()),
    [0, 0, -4],
    [0, 0, 0],
    [0, 1, 0]
  )
  const initialModelMatrix = mat4.identity(mat4.create())
  mat4.translate(initialModelMatrix, initialModelMatrix, [0, 0, 0])
  mat4.scale(initialModelMatrix, initialModelMatrix, [1, 1, 1])

  const program = createProgram(gl, createShader(gl, gl.VERTEX_SHADER, vertexShader), createShader(gl, gl.FRAGMENT_SHADER, fragmentShader))
  const mvpLocation = gl.getUniformLocation(program, "uMvpMatrix")
  const miLocation = gl.getUniformLocation(program, "uMiMatrix")
  const positionLocation = gl.getAttribLocation(program, "aPosition")
  const normalLocation = gl.getAttribLocation(program, "aNormal")

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions.flat()), gl.STATIC_DRAW)
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(positionLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  const tmpNormals: [number, number, number][] = []
  triangles.forEach(t => {
    const i0 = t[0]
    const i1 = t[1]
    const i2 = t[2]
    const v0 = positions[i0]
    const v1 = positions[i1]
    const v2 = positions[i2]

    const vv01 = vec3.create()
    vec3.subtract(vv01, v1, v0)
    const vv02 = vec3.create()
    vec3.subtract(vv02, v2, v0)
    const cross = vec3.create()
    vec3.cross(cross, vv02, vv01)
    ;[i0, i1, i2].forEach((i) => {
      tmpNormals[i] = tmpNormals[i] || [0, 0, 0]
      vec3.add(tmpNormals[i], tmpNormals[i], cross)
    })
  })
  const normals = tmpNormals.map(n => {
    vec3.normalize(n, n)
    return n
  })
  const normalBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals.flat()), gl.STATIC_DRAW)
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(normalLocation)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)


  gl.useProgram(program)

  let dragging = false
  let dragStartX = 0
  let dragStartY = 0
  let rotationX = 0
  let rotationY = 1
  let dragStartRX = 0
  let dragStartRY = 0
  canvas.addEventListener("mousedown", (e) => {
    if (e.buttons === 1) {
      dragging = true
      dragStartX = e.x
      dragStartY = e.y
      dragStartRX = rotationX
      dragStartRY = rotationY
    }
  })
  canvas.addEventListener("mouseup", (e) => {
    if (e.buttons === 1) {
      dragging = false
    }
  })
  canvas.addEventListener("mousemove", (e) => {
    if (e.buttons === 1 && dragging) {
      rotationY = dragStartRY - Math.PI / 100 * (e.x - dragStartX)
      rotationX = dragStartRX - Math.PI / 100 * (e.y - dragStartY)
    }
  })

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.frontFace(gl.CCW)
  gl.enable(gl.CULL_FACE)
  gl.cullFace(gl.BACK)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  async function process() {
    gl.clear(gl.COLOR_BUFFER_BIT)
    const modelMatrix = mat4.create()
    mat4.rotateX(modelMatrix, initialModelMatrix, rotationX)
    mat4.rotateY(modelMatrix, modelMatrix, rotationY)

    const modelViewProjectionMatrix = mat4.identity(mat4.create())
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix)
    mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix)
    gl.uniformMatrix4fv(mvpLocation, false, modelViewProjectionMatrix)

    const modelInverseMatrix = mat4.create()
    mat4.invert(modelInverseMatrix, modelMatrix)
    gl.uniformMatrix4fv(miLocation, false, modelInverseMatrix)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(triangles.flat()),
      gl.STATIC_DRAW
    )
    gl.drawElements(gl.TRIANGLES, triangles.length * 3, gl.UNSIGNED_SHORT, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    requestAnimationFrame(process)
  }
  requestAnimationFrame(process)
}
main()
