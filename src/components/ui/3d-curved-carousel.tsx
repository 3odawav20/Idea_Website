"use client"

import * as React from "react"

// A photo carousel seen through a curved lens. The cards sit on one WebGL canvas:
// the middle one reads flat, and the further a card travels from the centre, the
// taller and more bent it grows, with a fringe of chromatic split at the rim.
// Drag, flick, arrow keys or the buttons; it settles on a spring and loops.

export type LensSlide = {
  title: string
  kicker?: string
  caption?: string
  /** Same-origin or CORS-enabled photo URL. Portrait (about 4:5) reads best. */
  image: string
  alt?: string
}

export type CurvedLensCarouselProps = {
  slides: LensSlide[]
  label?: React.ReactNode
  hint?: React.ReactNode
  bend?: number
  background?: string
  ink?: string
  accent?: string
  height?: string
  className?: string
  /** Text direction of the captions; the stage itself always runs left to right. */
  dir?: "ltr" | "rtl"
  previousLabel?: string
  nextLabel?: string
  /** Extra content under the caption of the active slide, e.g. a link. */
  renderAction?: (slide: LensSlide, index: number) => React.ReactNode
  onChange?: (index: number) => void
}

export function wrap(i: number, n: number): number {
  return n > 0 ? ((i % n) + n) % n : 0
}

export function offsetOf(i: number, pos: number, n: number): number {
  if (n <= 0) return 0
  return wrap(i - pos + n / 2, n) - n / 2
}

export function restFor(pos: number, velocity: number, max = 3): number {
  return Math.round(pos + Math.max(-max, Math.min(max, velocity * 0.18)))
}

export function springStep(pos: number, vel: number, target: number, dt: number, omega = 11): [number, number] {
  const a = (target - pos) * omega * omega - vel * 2 * omega
  const v = vel + a * dt
  return [pos + v * dt, v]
}

export function cardSize(w: number, h: number): [number, number] {
  const cw = Math.min(w < 640 ? w * 0.56 : w * 0.22, h * 0.34)
  return [Math.round(cw), Math.round(cw * 1.25)]
}

export function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
}

const VERT =
  "attribute vec2 aPos;" +
  "uniform vec2 uRes;uniform vec2 uSize;uniform float uX;uniform float uBend;uniform float uVel;uniform float uIntro;uniform float uLift;" +
  "varying vec2 vUv;varying float vX;" +
  "void main(){" +
  "vec2 p=vec2(uX+(aPos.x-.5)*uSize.x,(aPos.y-.5)*uSize.y);" +
  "p.y-=(1.-uIntro)*uSize.y*.9;" +
  "vec2 n=p/(uRes*.5);" +
  "float x=clamp(n.x,-1.4,1.4);" +
  "n.y*=1.+uBend*x*x;" +
  "n.y+=uVel*.05*sin(aPos.x*3.14159)*(aPos.y-.5);" +
  "n.x*=1.-.06*uBend*x*x;n.y+=uLift;" +
  "vUv=aPos;vX=x;" +
  "gl_Position=vec4(n,0.,1.);}"

const FRAG =
  "precision highp float;" +
  "uniform sampler2D uTex;uniform vec2 uSize;uniform float uAspect;uniform float uVel;uniform float uIntro;uniform float uShift;uniform float uReady;" +
  "varying vec2 vUv;varying float vX;" +
  "float box(vec2 q,vec2 b,float r){vec2 d=abs(q)-b+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}" +
  "void main(){" +
  "float a=uSize.x/uSize.y;vec2 uv=vUv-.5;" +
  "if(uAspect>a)uv.x*=a/uAspect;else uv.y*=uAspect/a;" +
  "uv=uv/1.12+.5;uv.x+=uShift;" +
  "float ca=(.0012+.0045*vX*vX)*(1.+abs(uVel)*1.2);" +
  "vec3 c=vec3(texture2D(uTex,uv+vec2(ca,0.)).r,texture2D(uTex,uv).g,texture2D(uTex,uv-vec2(ca,0.)).b);" +
  "c=mix(vec3(.11,.11,.12),c,uReady);" +
  "c*=1.-.42*min(1.,vX*vX);" +
  "float d=box((vUv-.5)*uSize,uSize*.5,14.);" +
  "float rim=smoothstep(-5.,0.,d);" +
  "c+=rim*.10;" +
  "c+=.07*smoothstep(.55,1.,vUv.y)*(1.-abs(vX));" +
  "float al=smoothstep(.75,-.75,d)*uIntro;" +
  "gl_FragColor=vec4(c*al,al);}"

const CSS =
  ".clc-root{position:relative;width:100%;overflow:hidden;isolation:isolate;outline:none;user-select:none;-webkit-user-select:none}" +
  ".clc-root:focus-visible{box-shadow:inset 0 0 0 2px var(--clc-accent)}" +
  ".clc-glow{position:absolute;inset:-20%;background:radial-gradient(50% 40% at 50% 46%,color-mix(in srgb,var(--clc-accent) 14%,transparent),transparent 70%);pointer-events:none}" +
  ".clc-grain{position:absolute;inset:0;opacity:.06;mix-blend-mode:overlay;pointer-events:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")}" +
  ".clc-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y}" +
  ".clc-canvas:active{cursor:grabbing}" +
  ".clc-top{position:absolute;left:clamp(20px,4vw,48px);right:clamp(20px,4vw,48px);top:clamp(18px,3.4vw,36px);display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--clc-ink);opacity:.7;pointer-events:none}" +
  ".clc-top b{font-weight:600;letter-spacing:.14em;color:var(--clc-accent)}" +
  ".clc-copy{position:absolute;left:clamp(20px,4vw,48px);bottom:clamp(22px,4vw,44px);max-width:min(520px,60%);color:var(--clc-ink);pointer-events:none}" +
  ".clc-copy[dir=rtl]{left:auto;right:clamp(20px,4vw,48px);text-align:right}" +
  ".clc-kicker{display:block;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--clc-accent);margin-bottom:10px}" +
  ".clc-copy[dir=rtl] .clc-kicker{letter-spacing:0}" +
  ".clc-title{font-weight:600;font-size:clamp(36px,5.6vw,84px);line-height:1;letter-spacing:-.02em;margin:0;display:block}" +
  ".clc-copy[dir=rtl] .clc-title{letter-spacing:0;line-height:1.2}" +
  ".clc-line{display:block;overflow:hidden;padding-bottom:.08em}" +
  ".clc-w{display:inline-block;transform:translateY(105%) rotate(4deg);opacity:0;transition:transform .9s cubic-bezier(.2,.9,.1,1),opacity .6s ease}" +
  ".clc-in .clc-w{transform:none;opacity:1}" +
  ".clc-cap{display:block;margin-top:14px;font-size:15px;line-height:1.6;opacity:0;transform:translateY(10px);transition:opacity .7s ease .25s,transform .7s cubic-bezier(.2,.9,.1,1) .25s;max-width:36ch}" +
  ".clc-in .clc-cap{opacity:.72;transform:none}" +
  ".clc-act{display:block;margin-top:18px;opacity:0;transition:opacity .6s ease .4s;pointer-events:auto}" +
  ".clc-in .clc-act{opacity:1}" +
  ".clc-ctl{position:absolute;right:clamp(20px,4vw,48px);bottom:clamp(22px,4vw,44px);display:flex;flex-direction:column;align-items:flex-end;gap:16px;color:var(--clc-ink)}" +
  ".clc-root[data-dir=rtl] .clc-ctl{right:auto;left:clamp(20px,4vw,48px);align-items:flex-start}" +
  ".clc-count{font-size:12px;letter-spacing:.18em;font-variant-numeric:tabular-nums;opacity:.85}" +
  ".clc-count i{font-style:normal;opacity:.45}" +
  ".clc-bar{width:132px;height:2px;border-radius:2px;background:color-mix(in srgb,var(--clc-ink) 16%,transparent);overflow:hidden}" +
  ".clc-bar>span{display:block;height:100%;width:100%;background:var(--clc-accent);transform-origin:0 50%;transition:transform .7s cubic-bezier(.2,.9,.1,1)}" +
  ".clc-btns{display:flex;gap:10px}" +
  ".clc-btn{width:46px;height:46px;border-radius:999px;display:grid;place-items:center;color:var(--clc-ink);cursor:pointer;" +
  "background:color-mix(in srgb,var(--clc-ink) 8%,transparent);border:1px solid color-mix(in srgb,var(--clc-ink) 18%,transparent);" +
  "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" +
  "transition:transform .35s cubic-bezier(.3,1.6,.5,1),background .3s ease,border-color .3s ease,color .3s ease}" +
  ".clc-btn:hover{transform:translateY(-2px) scale(1.06);background:var(--clc-accent);border-color:var(--clc-accent);color:#fff}" +
  ".clc-btn:active{transform:scale(.94)}" +
  ".clc-btn:focus-visible{outline:2px solid var(--clc-accent);outline-offset:3px}" +
  ".clc-btn svg{width:18px;height:18px}" +
  ".clc-fallback{position:absolute;left:50%;top:50%;width:min(62vw,360px);aspect-ratio:4/5;transform:translate(-50%,-50%);object-fit:cover;border-radius:14px;max-width:none}" +
  "@media (max-width:640px){.clc-copy,.clc-copy[dir=rtl]{max-width:calc(100% - 40px);bottom:96px}.clc-ctl,.clc-root[data-dir=rtl] .clc-ctl{flex-direction:row;align-items:center;left:20px;right:20px;justify-content:space-between}.clc-bar{width:96px}}" +
  "@media (prefers-reduced-motion:reduce){.clc-w,.clc-cap,.clc-bar>span,.clc-btn{transition:opacity .2s ease}.clc-w,.clc-cap{transform:none}}"

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type) as WebGLShader
  gl.shaderSource(s, src)
  gl.compileShader(s)
  return s
}

function grid(segX: number, segY: number): Float32Array {
  const out: number[] = []
  for (let y = 0; y < segY; y++)
    for (let x = 0; x < segX; x++) {
      const x0 = x / segX, x1 = (x + 1) / segX, y0 = y / segY, y1 = (y + 1) / segY
      out.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1)
    }
  return new Float32Array(out)
}

// Words rise one by one; splitting by letter would break Arabic glyph joining.
function Words({ text, base }: { text: string; base: number }) {
  const words = text.split(" ")
  return (
    <>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span className="clc-w" style={{ transitionDelay: base + i * 90 + "ms" }}>{word}</span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </>
  )
}

function Copy({ slide, shown, dir, action }: { slide: LensSlide; shown: boolean; dir: "ltr" | "rtl"; action?: React.ReactNode }) {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    if (!shown) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)))
    return () => cancelAnimationFrame(id)
  }, [shown])
  return (
    <div className={"clc-copy" + (on ? " clc-in" : "")} dir={dir} aria-live="polite">
      {slide.kicker ? <span className="clc-kicker">{slide.kicker}</span> : null}
      <h3 className="clc-title">
        <span className="clc-line"><Words text={slide.title} base={60} /></span>
      </h3>
      {slide.caption ? <span className="clc-cap">{slide.caption}</span> : null}
      {action ? <span className="clc-act">{action}</span> : null}
    </div>
  )
}

export default function CurvedLensCarousel({
  slides,
  label,
  hint = "Drag to explore",
  bend = 0.55,
  background = "#0e0e10",
  ink = "#f3ede4",
  accent = "#fd6401",
  height = "100svh",
  className,
  dir = "ltr",
  previousLabel = "Previous slide",
  nextLabel = "Next slide",
  renderAction,
  onChange,
}: CurvedLensCarouselProps) {
  const n = slides.length
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [index, setIndex] = React.useState(0)
  const [shown, setShown] = React.useState(false)
  const [noGL, setNoGL] = React.useState(false)
  const api = React.useRef({ go: (_d: number) => {} })
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange

  React.useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    if (!canvas || !root || n === 0) return
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: true, alpha: true })
    if (!gl) {
      setNoGL(true)
      setShown(true)
      return
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const prog = gl.createProgram() as WebGLProgram
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setNoGL(true)
      setShown(true)
      return
    }
    gl.useProgram(prog)
    const mesh = grid(36, 12)
    const buf = gl.createBuffer() as WebGLBuffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "aPos")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u: Record<string, WebGLUniformLocation | null> = {}
    for (const k of ["uRes", "uSize", "uX", "uBend", "uVel", "uIntro", "uTex", "uAspect", "uShift", "uReady", "uLift"]) u[k] = gl.getUniformLocation(prog, k)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    let disposed = false
    const tex = slides.map((s) => {
      const t = gl.createTexture() as WebGLTexture
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([28, 28, 30, 255]))
      for (const [p, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]])
        gl.texParameteri(gl.TEXTURE_2D, p, v)
      const entry = { t, aspect: 0.8, ready: false }
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.decoding = "async"
      img.onload = () => {
        if (disposed) return
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        entry.aspect = img.naturalWidth / img.naturalHeight
        entry.ready = true
        kick()
      }
      img.src = s.image
      return entry
    })

    let stageW = 1, stageH = 1, cw = 1, ch = 1, gap = 1
    let pos = 0, vel = 0, target = 0
    let intro = reduced.matches ? 1 : 0
    let introStart = -1
    let dragging = false, dragX = 0, dragPos = 0, lastX = 0, lastT = 0, flick = 0
    let raf = 0, last = 0, visible = true, current = 0

    const resize = (w: number, h: number) => {
      stageW = Math.max(1, w)
      stageH = Math.max(1, h)
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(stageW * dpr)
      canvas.height = Math.round(stageH * dpr)
      ;[cw, ch] = cardSize(stageW, stageH)
      gap = cw * 0.14
      gl.viewport(0, 0, canvas.width, canvas.height)
      kick()
    }

    const draw = () => {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform2f(u.uRes, stageW, stageH)
      gl.uniform2f(u.uSize, cw, ch)
      gl.uniform1f(u.uBend, bend)
      gl.uniform1f(u.uVel, reduced.matches ? 0 : Math.max(-1, Math.min(1, vel * 0.12)))
      gl.uniform1f(u.uLift, stageW < 640 ? 0.3 : 0.15)
      const step = cw + gap
      for (let i = 0; i < n; i++) {
        const d = offsetOf(i, pos, n)
        const x = d * step
        if (Math.abs(x) > stageW * 0.5 + step * 1.5) continue
        const t = Math.max(0, Math.min(1, (intro - Math.abs(d) * 0.12) / 0.6))
        const e = 1 - Math.pow(1 - t, 3)
        gl.bindTexture(gl.TEXTURE_2D, tex[i].t)
        gl.uniform1f(u.uX, x)
        gl.uniform1f(u.uIntro, e)
        gl.uniform1f(u.uAspect, tex[i].aspect)
        gl.uniform1f(u.uReady, tex[i].ready ? 1 : 0)
        gl.uniform1f(u.uShift, Math.max(-0.05, Math.min(0.05, -d * 0.035)))
        gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 2)
      }
    }

    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      if (intro < 1) {
        if (introStart < 0) introStart = now
        intro = Math.min(1.5, (now - introStart) / 1100)
        if (intro >= 1.5) intro = 1
      }
      if (!dragging) {
        if (reduced.matches) {
          pos = target
          vel = 0
        } else [pos, vel] = springStep(pos, vel, target, dt)
      }
      const idx = wrap(Math.round(pos), n)
      if (idx !== current) {
        current = idx
        setIndex(idx)
        onChangeRef.current?.(idx)
      }
      draw()
      const settled = !dragging && Math.abs(target - pos) < 0.0005 && Math.abs(vel) < 0.001 && (intro >= 1 || reduced.matches)
      if (settled) {
        pos = target
        draw()
        last = 0
      } else if (visible) raf = requestAnimationFrame(frame)
    }

    function kick() {
      if (!raf && visible && !disposed) raf = requestAnimationFrame(frame)
    }

    api.current.go = (d: number) => {
      target = Math.round(target) + d
      kick()
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging = true
      dragX = lastX = e.clientX
      lastT = e.timeStamp
      dragPos = pos
      flick = 0
      canvas.setPointerCapture(e.pointerId)
      kick()
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const step = cw + gap
      const dts = Math.max(1, e.timeStamp - lastT) / 1000
      flick = flick * 0.6 + (-(e.clientX - lastX) / step / dts) * 0.4
      vel = flick
      lastX = e.clientX
      lastT = e.timeStamp
      pos = dragPos - (e.clientX - dragX) / step
      kick()
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      target = restFor(pos, flick)
      vel = flick
      kick()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.target !== root) return
      if (e.key === "ArrowRight") api.current.go(1)
      else if (e.key === "ArrowLeft") api.current.go(-1)
      else return
      e.preventDefault()
    }
    const onMotion = () => kick()

    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    root.addEventListener("keydown", onKey)
    reduced.addEventListener("change", onMotion)

    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      resize(r.width, r.height)
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      if (visible) {
        setShown(true)
        kick()
      }
    })
    io.observe(root)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      root.removeEventListener("keydown", onKey)
      reduced.removeEventListener("change", onMotion)
      for (const t of tex) gl.deleteTexture(t.t)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [n, slides, bend])

  const slide = slides[index] ?? slides[0]
  if (!slide) return null
  const vars = { height, background, "--clc-ink": ink, "--clc-accent": accent } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      className={"clc-root" + (className ? " " + className : "")}
      style={vars}
      dir="ltr"
      data-dir={dir}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={typeof label === "string" ? label : "Photo carousel"}
    >
      <style>{CSS}</style>
      <div className="clc-glow" aria-hidden="true" />
      <canvas ref={canvasRef} className="clc-canvas" aria-hidden="true" />
      {noGL ? <img className="clc-fallback" src={slide.image} alt={slide.alt ?? slide.title} /> : null}
      <div className="clc-grain" aria-hidden="true" />
      <div className="clc-top" dir={dir}>
        <b>{label}</b>
        <span>{hint}</span>
      </div>
      <Copy key={index} slide={slide} shown={shown} dir={dir} action={renderAction?.(slide, index)} />
      <div className="clc-ctl">
        <span className="clc-count">
          {pad2(index + 1)} <i>/ {pad2(n)}</i>
        </span>
        <span className="clc-bar" aria-hidden="true">
          <span style={{ transform: "scaleX(" + (index + 1) / n + ")" }} />
        </span>
        <div className="clc-btns">
          <button type="button" className="clc-btn" aria-label={previousLabel} onClick={() => api.current.go(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="clc-btn" aria-label={nextLabel} onClick={() => api.current.go(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
