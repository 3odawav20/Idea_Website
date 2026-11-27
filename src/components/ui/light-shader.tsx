"use client";
import { useEffect, useRef } from "react";

// Mesh drift shader supplied by the site owner (21st.dev Shader Builder).
// Restored GLSL directive line breaks from the pasted source.
const VERT = `attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
 precision highp float;
 
#else
 precision mediump float;
 
#endif
 uniform vec3 u_colors[8];
 
uniform vec4 u_scene;
 
uniform vec4 u_shape;
 
uniform vec4 u_surface;
 
uniform vec4 u_finish;
 
uniform vec4 u_transform;
 
uniform vec4 u_space;
 
uniform vec4 u_cursor;
 
#define u_resolution u_scene.xy
 
#define u_time u_scene.z
 
#define u_colorCount u_scene.w
 
#define u_scale u_shape.x
 
#define u_intensity u_shape.y
 
#define u_paramA u_shape.z
 
#define u_warp u_shape.w
 
#define u_detail u_surface.x
 
#define u_contrast u_surface.y
 
#define u_brightness u_surface.z
 
#define u_saturation u_surface.w
 
#define u_hue u_finish.x
 
#define u_vignette u_finish.y
 
#define u_blur u_finish.z
 
#define u_grain u_finish.w
 
#ifdef GL_FRAGMENT_PRECISION_HIGH
 
#define u_seed u_transform.x
 
#else
 

#define u_seed mod(u_transform.x, 31.0)
 
#endif
 
#define u_rotate u_transform.y
 
#define u_drift u_transform.z
 
#define u_oklab u_transform.w
 
#define u_offset u_space.xy
 
#define u_mouse u_space.zw
 
#define u_cursorPresence u_cursor.x
 
#define u_cursorEffect u_cursor.y
 
#define u_cursorStrength u_cursor.z
 
#define u_cursorRadius u_cursor.w
 float hash21(vec2 p) { 
#ifndef GL_FRAGMENT_PRECISION_HIGH
 p = mod(p, 31.0);
 
#endif
 p = fract(p * vec2(234.34, 435.345));
 p += dot(p, p + 34.23);
 return fract(p.x * p.y);
 } 
float grainHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031);
 p3 += dot(p3, p3.yzx + 33.33);
 return fract((p3.x + p3.y) * p3.z);
 } vec2 hash22(vec2 p) { 
#ifndef GL_FRAGMENT_PRECISION_HIGH
 p = mod(p, 31.0);
 
#endif
 float n = sin(dot(p, vec2(41.0, 289.0)));
 return fract(vec2(15731.743, 7892.321) * n);
 } float noise(vec2 p) { vec2 i = floor(p);
 vec2 f = fract(p);
 vec2 u = f * f * (3.0 - 2.0 * f);
 return mix( mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
 } float fbm(vec2 p) { float v = 0.0;
 float a = 0.5;
 for (int i = 0;
 i < 5;
 i++) { v += a * noise(p);
 p = p * 2.03 + vec2(17.0, 9.2);
 a *= 0.5;
 } return v;
 } 
vec3 srgbToLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
 } vec3 linearToSrgb(vec3 c) { 
return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
 } vec3 linToOklab(vec3 c) { float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
 float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
 float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
 l = pow(max(l, 0.0), 1.0 / 3.0);
 m = pow(max(m, 0.0), 1.0 / 3.0);
 s = pow(max(s, 0.0), 1.0 / 3.0);
 return vec3( 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
 } vec3 oklabToLin(vec3 c) { float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
 float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
 float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
 l = l * l * l;
 m = m * m * m;
 s = s * s * s;
 return vec3( 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
 } vec3 mixColour(vec3 a, vec3 b, float t) { if (u_oklab > 0.5) { vec3 la = linToOklab(srgbToLinear(a));
 vec3 lb = linToOklab(srgbToLinear(b));
 return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
 } return mix(a, b, t);
 } 
vec3 palette(float x) { float n = max(u_colorCount - 1.0, 1.0);
 float f = clamp(x, 0.0, 1.0) * n;
 vec3 col = u_colors[0];
 for (int i = 0;
 i < 7;
 i++) { if (float(i) < n) col = mixColour(col, u_colors[i + 1], smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
 } return col;
 } vec3 hueRotate(vec3 col, float a) { const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
 const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
 vec3 yiq = toYIQ * col;
 float ca = cos(a), sa = sin(a);
 yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
 return toRGB * yiq;
 } vec3 shade(vec2 uv, vec2 p, float t) { vec3 acc = u_colors[0] * 0.15;
 float total = 0.15;
 for (int i = 0;
 i < 8;
 i++) { if (float(i) >= u_colorCount) break;
 float fi = float(i);
 vec2 c = vec2( sin(t * (0.21 + fi * 0.071) + fi * 2.4 + u_seed), cos(t * (0.17 + fi * 0.093) + fi * 1.7)) * (0.45 + u_intensity * 0.35);
 float w = exp(-dot(p - c, p - c) * 6.0);
 acc += u_colors[i] * w;
 total += w;
 } return acc / total;
 } void main() { vec2 uv = gl_FragCoord.xy / u_resolution.xy;
 vec2 screenUv = uv;
 vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
 float cursorMask = 0.0;
 
if (u_cursorPresence > 0.001) { 
vec2 cursor = (0.5 * u_mouse * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
 vec2 cursorDelta = p - cursor;
 if (u_cursorEffect < 0.5) { p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
 } else { float cursorDistance = length(cursorDelta);
 vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
 cursorMask = u_cursorPresence * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
 if (u_cursorEffect < 1.5) { p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
 } else if (u_cursorEffect < 2.5) { float cursorAngle = cursorMask * u_cursorStrength * 2.2;
 float cc = cos(cursorAngle), cs = sin(cursorAngle);
 p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
 } else if (u_cursorEffect < 3.5) { float ripple = sin( cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
 p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
 } } } 
uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
 p *= u_scale;
 
if (abs(u_rotate) > 0.0001) { float cr = cos(u_rotate), sr = sin(u_rotate);
 p = mat2(cr, -sr, sr, cr) * p;
 } p += u_offset;
 if (u_drift > 0.0001) p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
 
if (u_warp > 0.0) { p += u_warp * (vec2( fbm(p * u_detail + u_seed), fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
 } 
vec3 col;
 if (u_blur > 0.0) { float e = u_blur;
 float pe = e * u_scale;
 vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
 col = shade(uv, p, u_time) * 0.36;
 col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
 col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
 col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
 col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
 } else { col = shade(uv, p, u_time);
 } 
if (abs(u_contrast - 1.0) > 0.0001) col = (col - 0.5) * u_contrast + 0.5;
 if (abs(u_saturation - 1.0) > 0.0001) { float luma = dot(col, vec3(0.299, 0.587, 0.114));
 col = mix(vec3(luma), col, u_saturation);
 } if (abs(u_hue) > 0.0001) col = hueRotate(col, u_hue);
 if (abs(u_brightness) > 0.0001) col += u_brightness;
 if (u_vignette > 0.0001) { float vd = length(screenUv - 0.5) * 1.41421356;
 col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
 } if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5) col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
 if (u_grain > 0.0001) col += (grainHash( gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
 gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
 } `;
const UNIFORMS = { colors: [[0.06274509803921569,0.06274509803921569,0.06274509803921569],[0.22745098039215686,0.22745098039215686,0.22745098039215686],[0.22745098039215686,0.22745098039215686,0.22745098039215686],[0.22745098039215686,0.22745098039215686,0.22745098039215686],[0.22745098039215686,0.22745098039215686,0.22745098039215686],[0.22745098039215686,0.22745098039215686,0.22745098039215686],[0.22745098039215686,0.22745098039215686,0.22745098039215686],[0.22745098039215686,0.22745098039215686,0.22745098039215686]] as [number, number, number][], colorCount: 2, scale: 2.500, intensity: 0.590, paramA: 0.500, warp: 0.000, detail: 2.400, contrast: 0.906, brightness: -0.100, saturation: 1.000, hue: 6.2832, vignette: 0.000, blur: 0.0156, grain: 0.158, seed: 1.0, rotate: 0.0000, offsetX: 0.000, offsetY: 0.000, drift: 0.028, cursorEnabled: true, cursorEffect: 4.0, cursorStrength: 1.000, cursorRadius: 0.351, oklab: 0.0, timeScale: 0.860, };

export function ShaderBackground({ className, mode = "dark" }: { className?: string; mode?: "dark" | "light" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.opacity = "0";
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("IDEA background shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERT);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("IDEA background link:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    const position = gl.getAttribLocation(program, "a_position");
    if (!buffer || position < 0) {
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const scene = uniform("u_scene"), space = uniform("u_space"), cursor = uniform("u_cursor");
    const light = mode === "light";
    const colors = light
      ? Array.from({ length: 8 }, (_, i) => i === 0 ? [0.87, 0.89, 0.92] : [0.98, 0.98, 0.99])
      : UNIFORMS.colors;
    gl.uniform3fv(uniform("u_colors[0]"), new Float32Array(colors.flat()));
    gl.uniform4f(uniform("u_shape"), UNIFORMS.scale, UNIFORMS.intensity, UNIFORMS.paramA, UNIFORMS.warp);
    gl.uniform4f(uniform("u_surface"), UNIFORMS.detail, UNIFORMS.contrast, light ? 0.025 : UNIFORMS.brightness, UNIFORMS.saturation);
    gl.uniform4f(uniform("u_finish"), UNIFORMS.hue, UNIFORMS.vignette, UNIFORMS.blur, light ? 0.025 : UNIFORMS.grain);
    gl.uniform4f(uniform("u_transform"), UNIFORMS.seed, UNIFORMS.rotate, UNIFORMS.drift, UNIFORMS.oklab);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, disposed = false, lost = false;
    let lastNow: number | null = null;
    let x = 0, y = 0, presence = 0, targetX = 0, targetY = 0, targetPresence = 0;
    let start = performance.now();
    const requestRender = () => {
      if (!disposed && !lost && !document.hidden && !frame) frame = requestAnimationFrame(render);
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rw = Math.max(1, Math.round(bounds.width * dpr));
      const rh = Math.max(1, Math.round(bounds.height * dpr));
      const scale = Math.min(1, Math.sqrt(2000000 / (rw * rh)));
      const w = Math.max(1, Math.round(rw * scale)), h = Math.max(1, Math.round(rh * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      requestRender();
    };
    const pointerMove = (event: PointerEvent) => {
      if (motion.matches || event.pointerType !== "mouse") return;
      const b = canvas.getBoundingClientRect();
      if (!b.width || !b.height) return;
      targetX = ((event.clientX - b.left) / b.width) * 2 - 1;
      targetY = -(((event.clientY - b.top) / b.height) * 2 - 1);
      targetPresence = 1;
      if (presence < 0.01) { x = targetX; y = targetY; }
      requestRender();
    };
    const pointerLeave = () => { targetPresence = 0; requestRender(); };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastNow = null; }
      else requestRender();
    };
    const motionChange = () => { targetPresence = 0; presence = 0; lastNow = null; start = performance.now(); requestRender(); };
    const contextLost = () => { lost = true; cancelAnimationFrame(frame); frame = 0; canvas.style.opacity = "0"; };
    function render(now: number) {
      frame = 0;
      if (disposed || lost || document.hidden) return;
      const dt = lastNow === null ? 0 : Math.min((now - lastNow) / 1000, 0.1);
      lastNow = now;
      const follow = 1 - Math.exp(-12 * dt);
      x += (targetX - x) * follow; y += (targetY - y) * follow;
      presence += (targetPresence - presence) * follow;
      gl!.uniform4f(scene, canvas!.width, canvas!.height, motion.matches ? 0 : ((now - start) / 1000) * UNIFORMS.timeScale, UNIFORMS.colorCount);
      gl!.uniform4f(space, UNIFORMS.offsetX, UNIFORMS.offsetY, x, y);
      gl!.uniform4f(cursor, motion.matches ? 0 : presence, UNIFORMS.cursorEffect, light ? 0.25 : UNIFORMS.cursorStrength, UNIFORMS.cursorRadius);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (gl!.getError() !== gl!.NO_ERROR) { canvas!.style.opacity = "0"; return; }
      canvas!.style.opacity = "1";
      if (!motion.matches) requestRender();
    }
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("pointercancel", pointerLeave);
    window.addEventListener("blur", pointerLeave);
    document.documentElement.addEventListener("pointerleave", pointerLeave);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChange);
    canvas.addEventListener("webglcontextlost", contextLost);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointercancel", pointerLeave);
      window.removeEventListener("blur", pointerLeave);
      document.documentElement.removeEventListener("pointerleave", pointerLeave);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", motionChange);
      canvas.removeEventListener("webglcontextlost", contextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      canvas.style.opacity = "0";
    };
  }, [mode]);
  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ opacity: 0 }} />;
}
