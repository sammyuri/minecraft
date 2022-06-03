type GL = WebGLRenderingContext;
export function createProgram(gl: GL, vertexSource: string, fragmentSource: string){
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  if (program == null){
    throw new Error("failed to create shader program");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);

    const linkErrLog = gl.getProgramInfoLog(program);
    throw new Error("Shader program did not link successfully. "
    + "Error log: " + linkErrLog);
  }

  return program;
}

function loadShader(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (shader == null){
    throw new Error("Failed to create shader");
  }
  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + info);
  }
  return shader;
}