/**
 * Aura: slow pools of warm light drifting behind the page.
 *
 * One fullscreen fragment shader mixes three layers of simplex noise into the
 * brand colours. It renders at half resolution (it is all soft gradients),
 * follows the cursor with a faint warm glow, and tints the light plum around a
 * hovered project card. A still frame is drawn for prefers-reduced-motion.
 */

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uAmt; uniform float uScroll;
uniform vec3 uFocus;
uniform vec3 cPaper; uniform vec3 cBlush; uniform vec3 cPeach; uniform vec3 cLilac; uniform vec3 cPlum;

// Simplex noise by Ashima Arts / Stefan Gustavson (MIT)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = uTime * 0.045;
  vec2 q = p + 0.22 * vec2(snoise(vec3(p * 0.8, t)), snoise(vec3(p * 0.8 + 17.3, t + 3.1)));
  q.y -= uScroll * 0.35;
  float a = snoise(vec3(q * 0.9 + vec2(1.7, 4.2), t * 0.9));
  float b = snoise(vec3(q * 0.7 + vec2(8.3, 2.1), t * 0.7 + 11.0));
  float c = snoise(vec3(q * 1.2 + vec2(3.9, 9.4), t * 0.8 + 23.0));
  float k = uAmt * 1.6;
  vec3 col = cPaper;
  col = mix(col, cBlush, clamp(smoothstep(-0.35, 0.85, a) * k, 0.0, 1.0));
  col = mix(col, cPeach, clamp(smoothstep(-0.1, 0.9, b) * k * 0.9, 0.0, 1.0));
  col = mix(col, cLilac, clamp(smoothstep(0.05, 0.95, c) * k * 0.75, 0.0, 1.0));
  vec2 m = vec2(uMouse.x * asp, 1.0 - uMouse.y);
  float d = distance(p, m);
  col = mix(col, cPeach, clamp(exp(-d * d * 7.0) * 0.6 * k, 0.0, 1.0));
  vec2 f = vec2(uFocus.x * asp, 1.0 - uFocus.y);
  float fd = distance(p, f);
  col = mix(col, cPlum, clamp(exp(-fd * fd * 4.0) * 0.26 * uFocus.z * (0.35 + k), 0.0, 1.0));
  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453) - 0.5) * (2.0 / 255.0);
  gl_FragColor = vec4(col + dither, 1.0);
}`;

type Vec3 = [number, number, number];

function hexToVec(hex: string): Vec3 {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export interface AuraOptions {
  /** 0–1. How far the colours move away from the paper colour. */
  intensity?: number;
  /** Canvas pixels per CSS pixel. The gradients are soft, so half is plenty. */
  resolution?: number;
  /** Elements that pull a plum glow toward themselves on hover. */
  focusTargets?: Iterable<Element>;
}

export function startAura(canvas: HTMLCanvasElement, options: AuraOptions = {}): () => void {
  const intensity = options.intensity ?? 0.5;
  const resolution = options.resolution ?? 0.5;

  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'low-power',
  });
  if (!gl) return () => {};

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[aura]', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return () => {};
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[aura]', gl.getProgramInfoLog(prog));
    return () => {};
  }
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const name of ['uRes', 'uTime', 'uMouse', 'uAmt', 'uScroll', 'uFocus', 'cPaper', 'cBlush', 'cPeach', 'cLilac', 'cPlum']) {
    U[name] = gl.getUniformLocation(prog, name);
  }

  const setPalette = () => {
    const cs = getComputedStyle(document.documentElement);
    const read = (name: string) => hexToVec(cs.getPropertyValue(name));
    gl.uniform3fv(U.cPaper, read('--paper'));
    gl.uniform3fv(U.cBlush, read('--aura-blush'));
    gl.uniform3fv(U.cPeach, read('--aura-peach'));
    gl.uniform3fv(U.cLilac, read('--aura-lilac'));
    gl.uniform3fv(U.cPlum, read('--aura-plum'));
  };
  setPalette();
  gl.uniform1f(U.uAmt, intensity);

  let W = window.innerWidth;
  let H = window.innerHeight;
  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    const w = Math.max(2, Math.round(W * resolution));
    const h = Math.max(2, Math.round(H * resolution));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uRes, w, h);
  };
  resize();

  // Cursor, eased so the glow trails behind the pointer
  const mouse = { x: W * 0.5, y: H * 0.4, tx: W * 0.5, ty: H * 0.4 };
  const onPointer = (e: PointerEvent) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
  };

  // Plum glow around a hovered card
  const focus = { x: 0.5, y: 0.5, s: 0, target: 0, el: null as Element | null };
  const cleanups: Array<() => void> = [];
  for (const el of options.focusTargets ?? []) {
    const enter = () => {
      focus.el = el;
      focus.target = 1;
    };
    const leave = () => {
      focus.target = 0;
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let time = 20; // start mid-drift so the first frame is already composed
  let last = performance.now();
  let raf = 0;
  let visible = true;

  const draw = () => {
    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uMouse, mouse.x / W, mouse.y / H);
    gl.uniform1f(U.uScroll, window.scrollY / H);
    gl.uniform3f(U.uFocus, focus.x, focus.y, focus.s);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    time += dt;
    const k = 1 - Math.exp(-dt * 4);
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.y += (mouse.ty - mouse.y) * k;
    if (focus.el) {
      const r = focus.el.getBoundingClientRect();
      focus.x = (r.left + r.width / 2) / W;
      focus.y = (r.top + r.height / 2) / H;
    }
    focus.s += (focus.target - focus.s) * (1 - Math.exp(-dt * 3));
    draw();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    cancelAnimationFrame(raf);
    if (reduceMotion.matches || !visible) {
      draw();
      return;
    }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const onResize = () => {
    resize();
    if (reduceMotion.matches) draw();
  };
  const onVisibility = () => {
    visible = document.visibilityState === 'visible';
    start();
  };

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  reduceMotion.addEventListener('change', start);
  start();
  canvas.classList.add('is-ready');

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    reduceMotion.removeEventListener('change', start);
    cleanups.forEach((fn) => fn());
  };
}
