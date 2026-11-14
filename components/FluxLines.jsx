"use client";
import { useEffect, useRef } from "react";
import "./FluxLines.css";
const MAX_COLORS = 8;
const INTRO_SECONDS = 1.8;
const FLOW = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0]
};
const DEFAULT_COLORS = [
  "#005014",
  // rich emerald shadow
  "#007a38",
  // forest green
  "#169040",
  // theme accent deep
  "#1DB954",
  // signature theme electric spring green
  "#22c55e",
  // luminous spring green
  "#1DB954",
  // signature theme electric spring green
  "#169040",
  // theme accent deep
  "#005e19"
  // deep emerald
];
const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;
const FIELD = `
float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * 3.14159265 - 3.14159265 / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}
`;
const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uLine;
uniform float uMaxHalf;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform vec4 uMagnet;
uniform vec4 uSwirl;
uniform float uReveal;
uniform float uLight;
uniform float uOpaque;
uniform vec3 uBackground;
uniform float uOpacity;
out vec4 outColor;
${FIELD}

vec3 palette(float h) {
  float x = clamp(h, 0.0, 1.0) * float(uColorCount - 1);
  int i = int(floor(x));
  int j = min(i + 1, uColorCount - 1);
  return mix(uColors[i], uColors[j], smoothstep(0.0, 1.0, x - float(i)));
}

void main() {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 frag = gl_FragCoord.xy;
  vec2 toMagnet = (frag - uMagnet.xy) / uResolution.y;
  float pull = uMagnet.z * exp(-dot(toMagnet, toMagnet) / (uMagnet.w * uMagnet.w));
  if (pull > 0.001) {
    float angle = pull * 0.55;
    float c = cos(angle);
    float s = sin(angle);
    frag = uMagnet.xy + mat2(c, s, -s, c) * (frag - uMagnet.xy);
  }
  if (uSwirl.w > 0.0) {
    vec2 d = frag - uSwirl.xy;
    float reach = uSwirl.z;
    float angle = uSwirl.w * exp(-dot(d, d) / (reach * reach));
    float c = cos(angle);
    float s = sin(angle);
    frag = uSwirl.xy + mat2(c, s, -s, c) * d;
  }
  vec2 p = frag / uResolution.y * ref;

  float spd = 200.0 * uSpeed;
  float t = uTime;
  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);
  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;
  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);
  float field = smin(peaks, peaks2, max(uFluidity, 0.001));

  float slope = length(vec2(dFdx(field), dFdy(field)));
  float gap = abs(field - 0.4);
  float pixels = gap / max(slope, 1e-6);
  float halfBand = max(uRimWidth, 0.001) * 0.5;
  float across = max(gap / halfBand, pixels / uMaxHalf);
  float band = 5.0 * uRimWidth * (1.0 - across);
  float reveal = smoothstep(0.2, 0.85, pull);
  float shimmer = vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer * (1.0 - reveal * 0.75);
  float lit = clamp(band - shimmer, 0.0, 1.0);
  float glow = pow(lit, uSharpness) * uGlow * (1.0 + reveal * 0.25);
  float core = uLine > 0.0 ? smoothstep(uLine + 0.75, uLine - 0.75, pixels) * max(smoothstep(0.08, 0.6, glow), reveal) : 0.0;
  float shine = clamp(glow, 0.0, 1.0);
  float energy = max(shine * shine, core * 0.85) * uReveal;

  float h = clamp(0.5 + (peaks - peaks2) * 0.8, 0.0, 1.0);
  vec3 tint = palette(h);

  if (uLight > 0.5) {
    float chroma = max(tint.r, max(tint.g, tint.b)) - min(tint.r, min(tint.g, tint.b));
    vec3 ink = mix(vec3(0.07, 0.07, 0.08), tint * 0.55, clamp(chroma * 1.6, 0.0, 1.0));
    float cover = energy * uOpacity;
    outColor = uOpaque > 0.5 ? vec4(mix(uBackground, ink, cover), 1.0) : vec4(ink * cover, cover);
    return;
  }

  vec3 light = tint * energy * uOpacity;
  outColor = uOpaque > 0.5 ? vec4(uBackground + light, 1.0) : vec4(light, max(light.r, max(light.g, light.b)));
}`;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  console.error("[FluxLines] Shader compile error:", gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
};
const link = (gl) => {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[FluxLines] Link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name.replace("[0]", "")] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};
const FluxLines = ({
  colors = DEFAULT_COLORS,
  speed = 0.15,
  scale = 1.2,
  turbulence = 0.12,
  fluidity = 0.1,
  rimWidth = 0.1,
  sharpness = 2,
  shimmer = 1,
  glow = 2.2,
  lineWidth = 1.2,
  flowDirection = "down",
  opacity = 1,
  mouseInteraction = true,
  mouseStrength = 0.5,
  mouseRadius = 0.25,
  mouseDampening = 0.15,
  clickSwirl = true,
  intro = true,
  lightMode = false,
  transparent = false,
  backgroundColor = "#070808",
  paused = false,
  dpr,
  mixBlendMode,
  className = "",
  style,
  ...rest
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const settings = {
    colors: Array.isArray(colors) && colors.length ? colors.slice(0, MAX_COLORS) : DEFAULT_COLORS,
    speed,
    scale: Math.max(0.05, scale),
    turbulence,
    fluidity: Math.max(1e-3, fluidity),
    rimWidth: Math.max(1e-3, rimWidth),
    sharpness: Math.max(0.1, sharpness),
    shimmer: Math.max(0, shimmer),
    glow: Math.max(0, glow),
    lineWidth: Math.max(0, lineWidth),
    flow: FLOW[flowDirection] ?? FLOW.down,
    opacity: clamp(opacity, 0, 1),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    mouseRadius: Math.max(0.01, mouseRadius),
    mouseDampening: Math.max(0, mouseDampening),
    clickSwirl,
    intro,
    lightMode,
    transparent,
    backgroundColor,
    paused,
    dpr
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!container || !canvas || !gl) return void 0;
    const program = link(gl);
    if (!program) return void 0;
    const u = program.uniforms;
    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const cache = /* @__PURE__ */ new Map();
    const parse = (value, fallback) => {
      if (!value) return fallback;
      const key = String(value).trim();
      if (cache.has(key)) return cache.get(key);
      let rgb = fallback;
      if (key.startsWith("#")) {
        const hex = key.slice(1);
        if (hex.length === 3) {
          rgb = [
            parseInt(hex[0] + hex[0], 16) / 255,
            parseInt(hex[1] + hex[1], 16) / 255,
            parseInt(hex[2] + hex[2], 16) / 255
          ];
        } else if (hex.length === 6) {
          rgb = [
            parseInt(hex.slice(0, 2), 16) / 255,
            parseInt(hex.slice(2, 4), 16) / 255,
            parseInt(hex.slice(4, 6), 16) / 255
          ];
        }
      } else if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = "#000000";
        probe.fillStyle = key;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      cache.set(key, rgb);
      return rgb;
    };
    const palette = new Float32Array(MAX_COLORS * 3);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const pointer = { x: 0, y: 0, inside: false };
    const magnet = { x: 0, y: 0, active: 0 };
    const swirl = { x: 0, y: 0, age: 10 };
    let time = 0;
    let reveal = settingsRef.current.intro && !reduce ? 0 : 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    const render = () => {
      const s = settingsRef.current;
      const ratio = canvas.width / Math.max(1, container.clientWidth);
      s.colors.forEach((value, index) => palette.set(parse(value, [0.11, 0.73, 0.33]), index * 3));
      const introVal = Math.min(1, reveal);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program.program);
      gl.bindVertexArray(vao);
      if (u.uResolution) gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      if (u.uTime) gl.uniform1f(u.uTime, time);
      if (u.uFlow) gl.uniform2f(u.uFlow, s.flow[0], s.flow[1]);
      if (u.uSpeed) gl.uniform1f(u.uSpeed, s.speed);
      if (u.uScale) gl.uniform1f(u.uScale, s.scale);
      if (u.uTurbulence) gl.uniform1f(u.uTurbulence, s.turbulence);
      if (u.uFluidity) gl.uniform1f(u.uFluidity, s.fluidity);
      if (u.uRimWidth) gl.uniform1f(u.uRimWidth, s.rimWidth);
      if (u.uSharpness) gl.uniform1f(u.uSharpness, s.sharpness);
      if (u.uShimmer) gl.uniform1f(u.uShimmer, s.shimmer);
      if (u.uGlow) gl.uniform1f(u.uGlow, s.glow);
      if (u.uLine) gl.uniform1f(u.uLine, s.lineWidth * ratio * 0.5);
      if (u.uMaxHalf) gl.uniform1f(u.uMaxHalf, 28 * ratio);
      if (u.uColors) gl.uniform3fv(u.uColors, palette);
      if (u.uColorCount) gl.uniform1i(u.uColorCount, s.colors.length);
      if (u.uMagnet) gl.uniform4f(u.uMagnet, magnet.x, magnet.y, magnet.active * s.mouseStrength, s.mouseRadius);
      const age = swirl.age;
      const twist = 1.9 * Math.min(1, age / 0.23) * Math.exp(-Math.max(0, age - 0.23) * 1.1);
      if (u.uSwirl) gl.uniform4f(u.uSwirl, swirl.x, swirl.y, canvas.height * 0.22 * (1 + age * 0.5), age < 6 ? twist : 0);
      if (u.uReveal) gl.uniform1f(u.uReveal, introVal * introVal * (3 - 2 * introVal));
      if (u.uLight) gl.uniform1f(u.uLight, s.lightMode ? 1 : 0);
      if (u.uOpaque) gl.uniform1f(u.uOpaque, s.transparent ? 0 : 1);
      if (u.uBackground) gl.uniform3fv(u.uBackground, parse(s.backgroundColor, [0.027, 0.031, 0.031]));
      if (u.uOpacity) gl.uniform1f(u.uOpacity, s.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? clamp((now - last) / 1e3, 5e-4, 0.05) : 1 / 60;
      last = now;
      const motion = s.paused || reduce ? 0 : 1;
      time += dt * motion;
      swirl.age += dt;
      if (s.intro && !reduce && reveal < 1) reveal = Math.min(1, reveal + dt / INTRO_SECONDS);
      else if (!s.intro || reduce) reveal = 1;
      const engaged = s.mouseInteraction && pointer.inside;
      const follow = s.mouseDampening > 0 ? 1 - Math.exp(-dt / s.mouseDampening) : 1;
      if (engaged) {
        magnet.x += (pointer.x - magnet.x) * follow;
        magnet.y += (pointer.y - magnet.y) * follow;
      }
      const target = engaged ? 1 : 0;
      magnet.active += (target - magnet.active) * (1 - Math.exp(-dt / 0.3));
      if (Math.abs(target - magnet.active) < 1e-3) magnet.active = target;
      render();
      const busy = motion > 0 || magnet.active !== target || reveal < 1 || swirl.age < 6;
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(window.innerWidth || 1, container.clientWidth || 1);
      const height = Math.max(window.innerHeight || 1, container.clientHeight || 1);
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      render();
      wake();
    };
    const locate = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const ratio = canvas.width / Math.max(1, rect.width);
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      pointer.x = x * ratio;
      pointer.y = (rect.height - y) * ratio;
    };
    const onPointerMove = (event) => {
      const wasInside = pointer.inside;
      locate(event);
      if (pointer.inside && !wasInside && magnet.active < 0.05) {
        magnet.x = pointer.x;
        magnet.y = pointer.y;
      }
      wake();
    };
    const onPointerDown = (event) => {
      onPointerMove(event);
      if (!pointer.inside || !settingsRef.current.clickSwirl || reduce) return;
      swirl.x = pointer.x;
      swirl.y = pointer.y;
      swirl.age = 0;
      wake();
    };
    const onPointerUp = (event) => {
      if (event.pointerType !== "mouse") pointer.inside = false;
    };
    const onPointerLeave = () => {
      pointer.inside = false;
    };
    const onVisibility = () => {
      last = 0;
      wake();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(() => {
      visible = true;
      if (visible) {
        last = 0;
        wake();
      }
    });
    intersection.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    };
    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program.program);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    };
  }, []);
  useEffect(() => {
    wakeRef.current?.();
  });
  return <div
    ref={containerRef}
    className={`flux-lines-container${className ? ` ${className}` : ""}`}
    style={mixBlendMode ? { ...style, mixBlendMode } : style}
    {...rest}
  >
      <canvas ref={canvasRef} className="flux-lines-canvas" aria-hidden="true" />
    </div>;
};
var FluxLines_default = FluxLines;
export {
  FluxLines_default as default
};
