/* =====================================================================
   THE SITE: one camera move driven by the scroll
   the climb (lancet) -> the rose -> the rose cracks and bursts outward ->
   Bruegel's world beyond, calm in the sun -> a flight into the Sun ->
   Earth and its satellites -> the Sun -> a swarm around it -> finale
   ===================================================================== */
(() => {
'use strict';
const SITE = window.SITE = {};
renderScale = Math.min(window.devicePixelRatio || 1, 1);   // the site renders at screen resolution at most, and adapts down if frames run long
let pS = 0, pRaw = 0, ready = false;

// story timing (in screen-heights of scroll)
const P_CRACK = 2.4, P_BREAK = 2.55, P_FLY = 4.15, P_WHITE = 4.86;
const SHIFT = 1.9, SPACE_RATE = 1.6;   // the space acts run 2.6x quicker than first written: short and punchy               // the space acts run 1.9 screens later than they were first written

// ---------------------------------------------------------------- scroll
function readScroll() { pRaw = window.scrollY / Math.max(1, window.innerHeight); }
window.addEventListener('scroll', readScroll, { passive: true });
let mX = 0, mY = 0;
window.addEventListener('mousemove', e => { mX = (e.clientX / innerWidth - 0.5) * 0.6; mY = (e.clientY / innerHeight - 0.5) * 0.6; });
readScroll();

const ease = t => t * t * (3 - 2 * t);
const ease5 = t => t * t * t * (t * (t * 6 - 15) + 10);
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

// ---------------------------------------------------------------- the beats of text
const beats = [...document.querySelectorAll('.beat')].map(el => ({ el, a: +el.dataset.from, b: +el.dataset.to, hold: el.dataset.hold === '1' }));
const white = document.createElement('div'); white.id = 'white'; document.body.appendChild(white);
const dim = document.createElement('div'); dim.id = 'dim'; document.body.appendChild(dim);   // darkens the glass behind the turn of the story
function beatsUpdate(p) {
  for (const B of beats) {
    const fin = seg(p, B.a - 0.04, B.a + 0.16), fout = B.hold ? 1 : 1 - seg(p, B.b - 0.16, B.b + 0.04);   // one passage leaves before the next arrives
    const o = Math.min(fin, fout);
    B.el.style.opacity = o.toFixed(3);
    B.el.style.transform = `translate3d(0,${((1 - fin) * 28 - (1 - fout) * 28).toFixed(1)}px,0)`;
    B.el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  }
  for (const B of beats) {
    const el = B.num === undefined ? (B.num = B.el.querySelector('[data-count]')) : B.num; if (!el) continue;
    // once the line is up, the number climbs in its own time, so it never rests half-counted
    const vis = +B.el.style.opacity || 0;
    if (vis > 0.35 && B.t0 === undefined) B.t0 = clock; if (vis < 0.02) B.t0 = undefined;
    const N = +el.dataset.count, f = B.t0 === undefined ? 0 : ease(clamp((clock - B.t0 - 0.25) / 1.9, 0, 1));
    const v = f >= 0.999 ? N : Math.max(1, Math.round(Math.pow(10, Math.log10(N) * f)));
    const txt = v.toLocaleString('en-US') + (el.dataset.suffix || '.'); if (el.textContent !== txt) el.textContent = txt;
  }
  for (const B of beats) {
    if (!B.el.classList.contains('sunline')) continue;
    const vis = +B.el.style.opacity || 0;
    if (vis > 0.3 && B.g0 === undefined) B.g0 = clock; if (vis < 0.02) B.g0 = undefined;
    const gs = B.gs || (B.gs = [...B.el.querySelectorAll('.big .g')]);
    gs.forEach((g, i) => { const a = B.g0 === undefined ? 0 : clamp((clock - B.g0 - 0.35 - i * 0.32) / 0.7, 0, 1); const v = (a * a * (3 - 2 * a)).toFixed(3); if (g.style.opacity !== v) g.style.opacity = v; });
  }
  { const B = beats.find(b => b.el.classList.contains('impact')); const v = B ? (+B.el.style.opacity || 0) * 0.95 : 0; const t = v.toFixed(3); if (dim.style.opacity !== t) dim.style.opacity = t; }
  const prog = document.getElementById('sprog'); if (prog) prog.style.transform = `scaleX(${clamp(p / 9, 0, 1).toFixed(4)})`;
  document.getElementById('scue').style.opacity = (1 - seg(p, 0.05, 0.4)).toFixed(3);
  // the glare of the Sun swallows the view, then lets go of it in space
  const w = 0.3 * (p < P_WHITE ? Math.pow(seg(p, 4.62, P_WHITE), 2) : 1 - ease(seg(p, P_WHITE, 5.1)));
  white.style.opacity = w.toFixed(3);
  document.body.classList.toggle('daylight', p > 3.4 && p < 4.75);
}

// ---------------------------------------------------------------- the chapel, steered by the scroll
SITE.before = dt => {
  pS += (pRaw - pS) * (1 - Math.exp(-dt * 5));
  if (FILM.on) filmTick();
  const p = pS;
  // act I: the lancet; act II: rise to the rose; act III: into the rose until it fills the eye
  let d, fy;
  // the whole chapel, candles and all; then in, onto Earth and its orbits; then down, slowly, to the companies' window;
  // then in again, until its picture is all you see, and it breaks
  if (p < 1.35) { const t = ease5(seg(p, 0.12, 1.0)); d = lerp(-0.3, 1.2, t); fy = lerp(6.6, 10.65, ease(seg(p, 0.12, 0.7))); }
  else if (p < 2.3) { const t = ease5(seg(p, 1.35, 2.3)); d = lerp(1.2, 0.82, t); fy = lerp(10.65, 4.25, t); }
  else { const t = seg(p, 2.3, P_REL0); d = lerp(0.82, 1.22, t * t); fy = 4.25; }
  cam.d = cam.dT = d; cam.fx = cam.fxs = 0; cam.fy = cam.fys = fy;
  // first seen from off to the right, the light falling across at an angle; the scroll brings you round to face it
  const side = 0.24 * (1 - ease5(seg(p, 0.04, 0.85)));
  cam.yawT = cam.yaw = side + Math.sin(clock * 0.07) * 0.05 * (1 - seg(p, 2.0, 2.4));
  cam.pitchT = cam.pitch = 0; cam.pxT = cam.px = 0; cam.pyT = cam.py = 0;
  roseColour(p, dt);
  music(p);
  const mk = 1 - seg(p, 2.25, 2.55); cam.mx = mX * mk; cam.my = mY * mk;
  beatsUpdate(p);
};
SITE.jump = p => { pRaw = pS = p; };
// head level: lift the camera, keeping its distance, until it faces the window square-on instead of looking up at it
SITE.cam = () => {
  const lv = ease(seg(pS, 0.15, 0.95));
  if (lv <= 0) return;
  const pos = cam.pos, F = cam.F;
  const t = (-0.55 - pos[2]) / F[2]; if (!(t > 0)) return;
  const T = [pos[0] + F[0] * t, pos[1] + F[1] * t, -0.55];
  const v = [pos[0] - T[0], pos[1] - T[1], pos[2] - T[2]], L = Math.hypot(...v), hz = Math.hypot(v[0], v[2]) || 1e-6;
  const el = Math.asin(v[1] / L) * (1 - lv), c = Math.cos(el) * L / hz;
  const np = [T[0] + v[0] * c, T[1] + Math.sin(el) * L, T[2] + v[2] * c];
  const nF = norm([T[0] - np[0], T[1] - np[1], T[2] - np[2]]), nR = norm(cross(nF, [0, 1, 0])), nU = cross(nR, nF);
  cam.pos = np; cam.F = nF; cam.R = nR; cam.U = nU;
};
SITE.dbg = () => ({ brk, lc, pS, MX, musicOn, shatter, FILM });   // for checking a moment of the story directly
SITE.ready = () => {
  // the window is shown whole: every company known, every fall mended
  previewOn();
  for (let s = 0; s < S; s++) { cur.set[s] = tgt.set[s]; cur.k[s] = tgt.k[s]; cur.a[s] = tgt.a[s]; cur.gold[s] = tgt.gold[s]; cur.start[s] = 0; cur.fl[s] = 0; cur.hold[s] = 0; }
  blazeNow = 1; sunNow = 1.38; glassDirtyL = glassDirtyR = true;
  initSpace(); initLand();
  buildPanes(); ensureChapelOut();          // ready before the glass breaks, so the break never stutters
  // draw every part of the break once now, unseen, so the graphics driver has prepared it all before it matters
  try { render(chapelOut); captureBreak(); landCam(P_REL0); renderLand(P_REL0); drawFrame(0); drawPanes(0); ensureSpaceOut(); renderSpace(spaceOut); } catch (e) { console.warn(e); }
  snapValid = false; for (const P of PANES.list) { P.rel = -1; P.down = false; } firstBreak = false;
  try { if (!MX && audio()) MX = initMusic(); } catch (e) {}   // the sound engine too: built now, not in the middle of the break
  buildRoseOrder();
  if (FILM.mode === 'auto') setTimeout(startFilm, 7000);
  if (FILM.mode === 'video') setTimeout(startFilmVideo, 7000);
  if (FILM.mode === 'audio') setTimeout(startFilmAudio, 7000);
  for (let s = 0; s < S; s++) { tgt.set[s] = 0; cur.set[s] = 0; }
  ready = true;
};
// the rose colours itself in as you come to it: Earth first, then each orbit traced round like a satellite
// going about it, then every family of satellites outward to the crown
let roseOrder = null, lastSetClink = 0;
function buildRoseOrder() {
  roseOrder = new Float32Array(S).fill(-1);
  const ribbons = [...new Set(W.shards.slice(ROSE_OFF).filter(q => q.kind === 3).map(q => q.fam))].sort((a, b) => a - b);
  const nR = Math.max(1, ribbons.length);
  // the companies' window: the Sun's own panes first, then the colour runs out from the Sun across the whole picture
  const sunZone = GROUPS.findIndex(g => g[0] === 'sun');
  for (let s = 0; s < ROSE_OFF; s++) {
    const q = W.shards[s], d = Math.hypot(q.cx - 1068, q.cy - 287) / 1300, rnd = mulberry32(s * 17 + 3)();
    roseOrder[s] = (q.zone === sunZone && sunZone >= 0) ? 0.02 * rnd : 0.05 + 0.8 * clamp(d, 0, 1) + 0.12 * rnd;
  }
  for (let s = ROSE_OFF; s < S; s++) {
    const q = W.shards[s], dx = q.cx - 1280, dy = q.cy - 1280, r = Math.hypot(dx, dy) / 1236, rnd = mulberry32(s * 13 + 7)();
    const ang = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) % 1;
    let o;
    if (q.kind === 2) o = -1 + 0.6 * clamp(r / 0.12, 0, 1) + 0.15 * rnd;   // Earth runs on its own, quicker clock
    else if (q.kind === 3) { const k = ribbons.indexOf(q.fam); o = 0.08 + k * (0.46 / nR) + ((ang - k / nR + 1) % 1) * (0.46 / nR) * 1.6; }
    else o = 2 + r;      // placed below, once the innermost of them is known
    roseOrder[s] = o;
  }
  // the rest of the rose follows straight on from the ribbons, no pause: from its innermost piece out to the crown
  let rmin = 1e9, rmax = 0; for (let s = ROSE_OFF; s < S; s++) if (roseOrder[s] >= 2) { rmin = Math.min(rmin, roseOrder[s] - 2); rmax = Math.max(rmax, roseOrder[s] - 2); }
  for (let s = ROSE_OFF; s < S; s++) if (roseOrder[s] >= 2) {
    const t = clamp((roseOrder[s] - 2 - rmin) / Math.max(1e-3, Math.min(1, rmax) - rmin), 0, 1);
    roseOrder[s] = 0.5 + 0.47 * t + 0.03 * mulberry32(s * 5 + 1)();
  }
}
function roseColour(p, dt) {
  if (!roseOrder) return;
  const q = seg(p, 0.2, 0.92) * 1.02, qE = seg(p, 0.06, 0.24) * 0.8 - 1;   // spread across the whole swing-and-zoom, done as it settles   // all of it glazed by the time the zoom comes to rest (p = 1)
  const qL = seg(p, 1.9, 2.5) * 1.02, done = [];   // begins as the window comes into view
  for (let s = 0; s < S; s++) {
    const o = roseOrder[s], earth = o < 0;
    const want = (s < ROSE_OFF ? qL : earth ? qE : q) > o ? 1 : 0;
    if (want && cur.set[s] < 1) { cur.set[s] = Math.min(1, cur.set[s] + dt * (earth ? 4.5 : 3.5)); if (cur.set[s] >= 1) { cur.flash[s] = 1; cur.fl[s] = 0; done.push(s); } }
    if (tgt.set[s] !== want) { tgt.set[s] = want; cur.start[s] = 0; if (want) cur.fl[s] = 1; }
  }
  if (done.length && clock - lastSetClink > 0.03) {
    lastSetClink = clock;
    // the largest pane that set this moment rings; a busy moment rings a second, smaller one too
    done.sort((x, y) => W.shards[y].area - W.shards[x].area);
    const ring = s => { const q = W.shards[s]; if (s < ROSE_OFF) clink(q.area, (q.cx / 1600) * 2 - 1); else clink(500 + q.area * 0.2, (q.cx / 1280 - 1) * 0.8); };
    ring(done[0]); if (done.length > 4) ring(done[done.length >> 1]);
  }
}
// ---------------------------------------------------------------- space: shaders
const SPACE_COMMON = `
uniform vec3 uCamPos, uCamR, uCamU, uCamF; uniform float uTanH, uAspect, uTime; uniform vec2 uRes;
uniform vec3 uEarth; uniform float uSunDim;
const float RS=6.0;
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
bool occ(vec3 p, vec3 c, float R){ vec3 d=p-uCamPos; float L=length(d); d/=L; vec3 oc=uCamPos-c; float b=dot(oc,d); float cc=dot(oc,oc)-R*R; float h=b*b-cc; if(h<0.) return false; float t=-b-sqrt(h); return t>0.&&t<L; }
`;
const FS_SPACE = HDR + `
in vec2 vUv; out vec4 o;
uniform sampler2D uEarthTex; uniform float uShell, uShellCrack, uGrow;
` + NOISE + SPACE_COMMON + `
float sphere(vec3 ro, vec3 rd, vec3 c, float R){ vec3 oc=ro-c; float b=dot(oc,rd), cc=dot(oc,oc)-R*R, h=b*b-cc; if(h<0.) return -1.; return -b-sqrt(h); }
float hash31(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
vec3 stars(vec3 d){
  vec3 col=vec3(0.);
  for(int l=0;l<3;l++){ float sc=float(120+l*170); vec3 p=d*sc; vec3 c=floor(p); float h=hash31(c+float(l)*17.);
    if(h>0.93){ vec3 q=fract(p)-0.5-(vec3(hash31(c+1.),hash31(c+2.),hash31(c+3.))-0.5)*0.6; float r=length(q);
      float b=pow(hash31(c+4.),6.)*3.+0.15; float tw=0.75+0.25*sin(uTime*(1.+h*3.)+h*40.);
      vec3 tint=mix(vec3(0.7,0.8,1.),vec3(1.,0.85,0.7),hash31(c+5.));
      col+=tint*b*tw*exp(-r*r*900./(1.+float(l))); } }
  // the galaxy: a faint band of light and dust
  vec3 gn=normalize(vec3(0.3,0.85,0.42)); float g=dot(d,gn);
  float band=exp(-g*g*28.); float n=fbm(vec2(atan(d.z,d.x)*3.,d.y*3.)*2.);
  col+=vec3(0.55,0.5,0.62)*band*(0.012+0.05*n*n)*(0.6+0.4*smoothstep(0.3,0.7,n));
  return col;
}
void main(){
  vec2 ndc=(gl_FragCoord.xy/uRes)*2.-1.;
  vec3 rd=normalize(uCamF+ndc.x*uTanH*uAspect*uCamR+ndc.y*uTanH*uCamU), ro=uCamPos;
  vec3 col=stars(rd)*0.9;
  float tS=sphere(ro,rd,vec3(0.),RS), tE=sphere(ro,rd,uEarth,1.);
  // the Sun's corona and light
  float b=-dot(ro,rd); vec3 cp=ro+rd*max(b,0.); float dc=length(cp);
  if(b>0.){ float e=max(dc-RS,0.); float ang=atan(cp.y,length(cp.xz));
    float streak=0.6+0.4*fbm(vec2(atan(cp.z,cp.x)*6.,uTime*0.02));
    col+=vec3(1.,0.72,0.42)*(3.2*exp(-e/1.6)+0.9*exp(-e/7.)*streak+0.16*exp(-e/30.))*uSunDim; }
  if(tS>0.&&(tE<0.||tS<tE)){
    vec3 n=normalize(ro+rd*tS); float mu=max(0.,dot(n,-rd));
    float gran=0.85+0.3*fbm(n.xz*24.+n.y*11.+uTime*0.03);
    col=vec3(1.,0.86,0.66)*pow(mu,0.55)*gran*55.*uSunDim+vec3(1.,0.5,0.2)*(1.-mu)*6.*uSunDim; }
  if(tE>0.&&(tS<0.||tE<tS)){
    vec3 p=ro+rd*tE, n=normalize(p-uEarth); vec3 L=normalize(-uEarth);
    float rot=uTime*0.01; float lon=atan(n.x,n.z)+rot, lat=asin(clamp(n.y,-1.,1.));
    vec3 alb=texture(uEarthTex,vec2(fract(lon/6.2832+0.5),0.5-lat/3.14159)).rgb;
    float cl=smoothstep(0.55,0.8,fbm(vec2(lon*3.,lat*5.)+uTime*0.004)); alb=mix(alb,vec3(0.92),cl*0.75);
    float dif=max(0.,dot(n,L)); float term=smoothstep(-0.08,0.25,dot(n,L));
    vec3 h=normalize(L-rd); float spec=pow(max(0.,dot(n,h)),60.)*(1.-cl)*0.6;
    col=alb*(dif*2.4*term*uSunDim+0.012)+vec3(1.,0.9,0.75)*spec*term*uSunDim;
    float fr=pow(1.-max(0.,dot(n,-rd)),3.); col+=vec3(0.3,0.55,1.)*fr*(0.15+1.4*term)*uSunDim;
    // city lights on the night side
    float night=1.-smoothstep(-0.15,0.05,dot(n,L)); float land=step(0.12,alb.g-alb.b*0.6);
    col+=vec3(1.,0.7,0.35)*night*land*pow(fbm(vec2(lon,lat)*40.),7.)*0.45; }
  else { // the thin blue air around Earth
    vec3 oc=ro-uEarth; float bb=-dot(oc,rd); float dd=length(oc+rd*bb);
    if(bb>0.&&dd>1.){ vec3 L=normalize(-uEarth); col+=vec3(0.3,0.55,1.)*exp(-(dd-1.)/0.05)*0.8*clamp(dot(normalize(oc+rd*bb),L)+0.4,0.,1.)*uSunDim; } }
  // a rigid shell, briefly, before it fails
  if(uShell>0.001){ float tH=sphere(ro,rd,vec3(0.),62.);
    if(tH>0.){ vec3 n=normalize(ro+rd*tH); float fr=pow(1.-abs(dot(n,rd)),2.);
      vec2 q=vec2(atan(n.z,n.x)*12.,asin(n.y)*12.); vec2 f=abs(fract(q)-0.5); float grid=1.-smoothstep(0.0,0.04,min(f.x,f.y));
      float cr=1.-smoothstep(0.0,0.008,abs(fbm(q*0.7+3.)-0.5));
      col=mix(col,col*0.35,uShell*0.6)+(vec3(0.75,0.6,0.38)*(0.05+0.25*fr)+vec3(1.,0.8,0.5)*grid*0.12)*uShell+vec3(1.,0.55,0.22)*cr*uShellCrack*uShell*1.4; } }
  o=vec4(col,1.);
}`;
const VS_SATS = HDR + `
layout(location=0) in vec4 aA; layout(location=1) in vec2 aB;
uniform float uPx, uVis; out vec3 vC; out float vA;
` + SPACE_COMMON + `
vec3 eci(float r,float inc,float raan,float u){ float cu=cos(u),su=sin(u),ci=cos(inc),si=sin(inc),cO=cos(raan),sO=sin(raan);
  vec3 p=vec3(r*(cO*cu-sO*su*ci), r*(sO*cu+cO*su*ci), r*su*si); return vec3(p.x,p.z,-p.y); }
void main(){
  float u=aA.w+aB.x*uTime*140.; vec3 p=uEarth+eci(aA.x,aA.y,aA.z,u);
  vec3 v=p-uCamPos; float z=dot(v,uCamF);
  if(z<0.05||uVis<=0.003||occ(p,uEarth,1.)||occ(p,vec3(0.),RS)){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vA=0.; return; }
  gl_Position=vec4(dot(v,uCamR)/(z*uTanH*uAspect), dot(v,uCamU)/(z*uTanH), 0., 1.);
  int c=int(aB.y+0.5);
  vC = c==0?vec3(0.55,0.72,1.):c==1?vec3(1.,0.45,0.5):c==2?vec3(1.,0.78,0.38):c==3?vec3(1.,0.55,0.35):c==4?vec3(1.,0.88,0.62):vec3(0.75,0.85,1.);
  // in Earth's shadow a satellite goes dark
  vec3 toS=normalize(-p); vec3 oc=p-uEarth; float bb=dot(oc,toS); float lit=(bb<0.&&length(oc-toS*bb)<1.)?0.12:1.;
  gl_PointSize=clamp(uPx*14./z,uPx,3.5*uPx);
  vA=uVis*lit*(c==5?0.55:1.)*0.9;
}`;
const VS_SWARM = HDR + `
uniform float uPx, uGrow, uRing, uIR; uniform int uMode; out vec3 vC; out float vA;
` + SPACE_COMMON + `
float hh(float n){ return fract(sin(n*12.9898+78.233)*43758.5453); }
void main(){
  float id=float(gl_VertexID); vec3 p; float bright;
  if(uMode==1){ // Earth's orbit, faint
    float a=id/2400.*6.2832; float R=length(uEarth); p=vec3(cos(a)*R,0.,sin(a)*R); vC=vec3(0.45,0.6,1.); bright=uRing*0.35;
  } else {
    if(hh(id*1.17)>uGrow){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vA=0.; return; }
    float plane=mod(id,96.), shell=mod(floor(id/96.),3.);
    float c=(plane+0.5)/96.; float ph=plane*2.399963; float sn=sqrt(1.-c*c);
    vec3 n=normalize(vec3(sn*cos(ph),c,sn*sin(ph)));
    vec3 a=normalize(cross(n,abs(n.y)<0.95?vec3(0.,1.,0.):vec3(1.,0.,0.))), b=cross(n,a);
    float r=36.+13.*shell+(hh(id*3.1)-0.5)*2.2;
    float phase=hh(id*7.7)*6.2832+uTime*0.42*pow(36./r,1.5);
    p=(a*cos(phase)+b*sin(phase))*r;
    float face=0.55+0.45*dot(normalize(p),normalize(uCamPos-p));
    vC=mix(vec3(1.,0.8,0.48),vec3(0.55,0.68,1.),step(0.72,hh(id*5.3)))*face+vec3(1.,0.25,0.08)*uIR;
    bright=0.8;
  }
  vec3 v=p-uCamPos; float z=dot(v,uCamF);
  if(z<0.1||occ(p,vec3(0.),RS)||occ(p,uEarth,1.)){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vA=0.; return; }
  gl_Position=vec4(dot(v,uCamR)/(z*uTanH*uAspect), dot(v,uCamU)/(z*uTanH), 0., 1.);
  gl_PointSize=clamp(uPx*120./z,uPx,3.*uPx);
  vA=bright*clamp(130./z,0.55,1.3);
}`;
const FS_DOT = HDR + `
in vec3 vC; in float vA; out vec4 o;
void main(){ vec2 d=gl_PointCoord-0.5; float r=dot(d,d)*4.; o=vec4(vC*vA*exp(-r*3.),1.); }`;

// =====================================================================
//   BEYOND THE GLASS: Bruegel's world as three depth planes, alive
// =====================================================================
const LAND_COMMON = `
uniform vec3 uCamPos, uCamR, uCamU, uCamF; uniform float uTanH, uAspect, uTime; uniform vec2 uRes;
float hh(float n){ return fract(sin(n*12.9898+78.233)*43758.5453); }
`;
const FS_LAND = HDR + `
in vec2 vUv; out vec4 o;
uniform sampler2D uBack, uMidC, uMidA, uNearC, uNearA, uSea;
uniform vec4 uMidBox, uNearBox, uPC; uniform vec3 uZ, uSunW, uC0; uniform vec2 uSunUV; uniform float uHorizon, uPA, uGlare, uWhite, uLight, uSunAng;
` + NOISE + LAND_COMMON + `
vec3 lin(vec3 c){ return pow(max(c,0.),vec3(2.2)); }
// the painting's layers stand behind the window at world depth Z, each scaled from where you stood so that,
// from there, every layer lines up exactly with the glass picture of it
bool plane(vec3 ro, vec3 rd, float Z, out vec2 uv){ uv=vec2(-1.); if(abs(rd.z)<1e-5) return false; float t=(Z-ro.z)/rd.z; if(t<=0.) return false;
  float r=(uC0.z-Z)/(uC0.z+0.55); vec2 c=uC0.xy+(uPC.xy-uC0.xy)*r, hs=uPC.zw*r;
  vec3 h=ro+rd*t; uv=vec2((h.x-c.x)/hs.x*0.5+0.5, 0.5-(h.y-c.y)/hs.y*0.5); return true; }
bool inBox(vec2 uv, vec4 b, out vec2 q){ q=(uv-b.xy)/(b.zw-b.xy); return q.x>0.&&q.y>0.&&q.x<1.&&q.y<1.; }
float bird(vec2 p, float flap){ if(abs(p.x)>1.) return 0.; float y=-(abs(p.x)*0.55-0.18*p.x*p.x)*flap+0.1*(1.-abs(p.x));
  float d=abs(p.y-y); return smoothstep(0.16,0.05,d)*(1.-smoothstep(0.75,1.,abs(p.x))*0.6); }
void main(){
  vec2 ndc=vUv*2.-1.;
  vec3 rd=normalize(uCamF+ndc.x*uTanH*uAspect*uCamR+ndc.y*uTanH*uCamU), ro=uCamPos;
  vec2 ub; plane(ro,rd,uZ.z,ub);
  // the sea breathes: small waves bend the far water, the sun's path glitters
  vec2 sm=texture(uSea,ub).rg; float sea=max(sm.r,sm.g*0.5);
  float below=max(ub.y-uHorizon,0.);
  vec2 ubw=ub; ubw.x+=sea*smoothstep(0.,0.04,below)*sin(ub.y*1100.+uTime*1.4+3.*sin(ub.x*36.+uTime*0.25))*0.0006;
  ubw.y+=sea*smoothstep(0.,0.04,below)*sin(ub.x*420.-uTime*0.9)*0.00035;
  vec3 col=lin(texture(uBack,ubw).rgb);
  // water the land had hidden: waves laid on a sea plane in perspective
  float hid=sm.g;
  if(hid>0.01&&below>0.002){
    vec2 W=vec2((ub.x-0.5)*uPA/below, 1./below);
    vec2 wq=W*vec2(3.2,1.1)+vec2(uTime*0.04,uTime*0.1);
    float fade=smoothstep(0.004,0.06,below);
    float n1=fbm(wq*vec2(1.,2.4)), n2=vnoise(wq*vec2(3.,8.)+3.);
    vec3 wc=col*(0.86+0.26*n1)+vec3(0.5,0.62,0.5)*smoothstep(0.6,0.82,n2)*0.05;
    float wl=dot(wc,vec3(.2126,.7152,.0722)); wc=mix(vec3(wl),wc,0.75)*vec3(0.98,1.03,0.94);
    col=mix(col,wc,clamp(hid*1.2,0.,1.)*fade);
  }
  // above the painting's edge the sky goes on: its soft light, never the edge's stretched brushwork
  float over=smoothstep(0.07,-0.03,ub.y);
  if(over>0.){ vec3 sk=lin(textureLod(uBack,vec2(clamp(ub.x,0.02,0.98),0.05),6.).rgb)*mix(1.,0.9,smoothstep(0.,-0.4,ub.y)); col=mix(col,sk,clamp(over,0.,1.)); }
  // the sky: slow cloud light drifting on the breeze
  float sky=1.-smoothstep(uHorizon-0.03,uHorizon,ub.y);
  float cl=fbm(vec2(ub.x*2.2-uTime*0.008, ub.y*6.5+uTime*0.0015));
  col*=1.+sky*(cl-0.5)*0.3;
  float path=exp(-pow((ub.x-uSunUV.x)/(0.006+below*0.42),2.));
  vec2 gq=vec2(ub.x*620.,ub.y*2300.)/(0.35+below*3.);
  float gl1=pow(vnoise(gq+vec2(uTime*0.9,-uTime*0.5)),10.)*pow(vnoise(gq*1.7-vec2(uTime*0.6,uTime*0.3)),3.);
  col+=vec3(1.,0.86,0.6)*sea*smoothstep(0.,0.004,below)*(gl1*(0.5+30.*path)+path*0.45*exp(-below*9.));
  // gulls, high and far
  vec2 ug; if(plane(ro,rd,mix(uZ.y,uZ.z,0.3),ug)){
    for(int i=0;i<7;i++){ float fi=float(i);
      vec2 c=vec2(fract(hh(fi*3.1)+uTime*(0.0025+0.003*hh(fi*5.7))), 0.05+0.17*hh(fi*7.3));
      c.y+=0.006*sin(uTime*0.4+fi);
      float s=0.0045+0.004*hh(fi*1.9);
      vec2 p=(ug-c)*vec2(uPA,1.)/s;
      float flap=0.35+0.65*sin(uTime*(3.+2.*hh(fi*2.3))+fi*4.);
      col=mix(col, vec3(0.05,0.045,0.04), bird(p,flap)*0.55*smoothstep(uHorizon,uHorizon-0.06,ug.y)); } }
  // the far ship and the islands
  vec2 um,q; if(plane(ro,rd,uZ.y,um) && inBox(um,uMidBox,q)){
    q.x+=sin(uTime*0.5)*0.0006*q.y;
    float a=texture(uMidA,q).r; col=mix(col,lin(texture(uMidC,q).rgb),a); }
  // the near shore: trees and grass move in the wind, the figures do not
  vec2 un; if(plane(ro,rd,uZ.x,un) && inBox(un,uNearBox,q)){
    vec3 c0=texture(uNearC,q).rgb;
    float fol=smoothstep(0.,0.035,c0.g-max(c0.r,c0.b)*0.93)*smoothstep(0.55,0.12,dot(c0,vec3(.3,.6,.1)));
    vec2 w=vec2(fbm(q*11.+vec2(uTime*0.32,0.)),fbm(q*11.+vec2(5.,uTime*0.27)))-0.5;
    w.x+=0.35*sin(uTime*0.8+q.y*5.+q.x*3.);
    vec2 q2=q+w*0.0042*fol*vec2(1.,0.5);
    float a=texture(uNearA,q2).r; col=mix(col,lin(texture(uNearC,q2).rgb),a); }
  // the Sun: Bruegel's setting disc, made to burn, and its glare on the air
  vec2 ds=(ub-uSunUV)*vec2(uPA,1.);
  float dsl=length(ds);
  col+=vec3(1.,0.84,0.58)*smoothstep(0.0252,0.0228,dsl)*step(ub.y,uHorizon+0.004)*9.*uGlare;
  // its glare is measured in sun-widths, so drawing in on it shows the disc, not a white-out
  vec3 sd=normalize(uSunW-ro); float x=acos(clamp(dot(rd,sd),-1.,1.))/uSunAng;
  vec2 sp=vec2(dot(rd-sd,uCamR),dot(rd-sd,uCamU)); float ang=atan(sp.y,sp.x);
  float rays=0.55+0.45*fbm(vec2(ang*7.,uTime*0.03));
  col+=vec3(1.,0.78,0.5)*(1.4*exp(-max(x-1.,0.)*2.5)+0.25*exp(-x*0.35)*rays+0.04*exp(-x*0.05))*uGlare;
  // warm afternoon: everything lit, the air thick with light toward the horizon
  float l=dot(col,vec3(.2126,.7152,.0722));
  col=col*vec3(1.08,1.0,0.86)*uLight;
  col+=vec3(1.,0.85,0.6)*0.05*exp(-abs(ub.y-uHorizon)*9.)*uLight;
  col=mix(col, vec3(30.,26.,20.), uWhite);
  o=vec4(col,1.);
}`;
// sunlit pollen and dust in the air over the land
const VS_MOTE = HDR + `
uniform float uPx, uVis; uniform vec3 uSunW; out vec3 vC; out float vA;
` + LAND_COMMON + `
void main(){
  float id=float(gl_VertexID); vec3 h=vec3(hh(id*1.7),hh(id*2.9),hh(id*4.3)); const float L=14.;
  vec3 p=vec3((h.x-0.5)*6.+uTime*0.06+sin(uTime*0.37+id)*0.06, (h.y-0.5)*2.6+sin(uTime*0.29+id*1.3)*0.07, 0.);
  p.x=mod(p.x+3.,6.)-3.+uCamPos.x; p.y+=uCamPos.y; p.z=uCamPos.z-0.25-mod(h.z*L+uCamPos.z,L);
  vec3 v=p-uCamPos; float z=dot(v,uCamF);
  if(z<0.2||uVis<0.003){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; vA=0.; return; }
  gl_Position=vec4(dot(v,uCamR)/(z*uTanH*uAspect), dot(v,uCamU)/(z*uTanH), 0., 1.);
  float ph=0.06+2.2*pow(max(dot(normalize(v),normalize(uSunW-p)),0.),9.);
  vC=vec3(1.,0.85,0.58)*ph*(0.6+0.8*hh(id*6.1));
  vA=uVis*smoothstep(0.2,0.9,z)*(1.-smoothstep(L*0.65,L,z))*(0.5+0.5*sin(uTime*(0.6+hh(id)*1.5)+id));
  gl_PointSize=clamp(uPx*4.5/z,uPx,4.5*uPx);
}`;

// =====================================================================
//   THE BREAK: the companies' window comes out pane by pane
// =====================================================================
const BREAK_COMMON = `
uniform vec3 uC0, uR0, uU0, uF0; uniform float uT0, uA0;      // where you stood when the glass broke
vec2 snapUV(vec3 w){ vec3 v=w-uC0; float z=dot(v,uF0); return vec2(dot(v,uR0)/(z*uT0*uA0), dot(v,uU0)/(z*uT0))*0.5+0.5; }
float winSD(vec2 uv){ vec2 P=uv*vec2(1600.,1100.); float dB=max(max(-P.x,P.x-1600.),P.y-1100.); float dC=length(P-vec2(800.,1453.3333))-1453.3333; return max(dB,dC); }
vec2 winUVw(vec2 xy){ return vec2(xy.x/6.+0.5, 0.5-(xy.y-4.1625)/4.125); }
`;
// each pane: a quad over its bounding box, cut to its exact shape by the window's own map of panes
const VS_PANE = HDR + `
layout(location=0) in vec3 aP; layout(location=1) in vec3 aRest; layout(location=2) in vec3 aN; layout(location=3) in vec4 aI;
uniform vec3 uCamPos, uCamR, uCamU, uCamF; uniform float uTanH, uAspect;
out vec3 vW, vRest, vN; out vec4 vI;
void main(){
  vec3 v=aP-uCamPos; float z=dot(v,uCamF); const float n=0.02, f=400.;
  gl_Position=vec4(dot(v,uCamR)/(uTanH*uAspect), dot(v,uCamU)/uTanH, (z*(f+n)-2.*f*n)/(f-n), z);
  vW=aP; vRest=aRest; vN=aN; vI=aI;
}`;
const FS_PANE = HDR + `
in vec3 vW, vRest, vN; in vec4 vI; out vec4 o;
uniform highp usampler2D uSid; uniform sampler2D uImg; uniform vec3 uCamPos, uLightP;
` + BREAK_COMMON + `
void main(){
  vec2 wuv=winUVw(vRest.xy);
  uint id=texelFetch(uSid, ivec2(clamp(wuv,0.,0.9999)*vec2(1600.,1100.)), 0).r;
  if(abs(float(id)-vI.x)>0.5) discard;
  vec3 g=texture(uImg,snapUV(vRest)).rgb;
  float away=vI.y, shiver=vI.z;
  vec3 V=normalize(uCamPos-vW), N=normalize(vN); if(dot(N,V)<0.) N=-N;
  vec3 Ld=normalize(uLightP-vW);
  // once out of the window the glass is no longer lit from behind: it keeps its colour, loses its glow,
  // and catches the light of the open window in its face as it turns
  float back=pow(max(0.,dot(-V,Ld)),3.);
  vec3 c=g*mix(1.,0.22+0.95*back,away);
  float F=0.04+0.96*pow(1.-abs(dot(N,V)),5.);
  vec3 R=reflect(-V,N); float sp=pow(max(dot(R,Ld),0.),90.);
  c+=(vec3(1.,0.93,0.8)*F*0.55+vec3(1.,0.95,0.85)*sp*1.6)*away;
  c+=vec3(1.,0.95,0.85)*shiver*0.35;
  o=vec4(min(c,vec3(1.)),1.);
}`;
// the stone around the window: the last image of the chapel, with the opening cut out of it
const FS_FRAME = HDR + `
in vec2 vUv; out vec4 o;
uniform sampler2D uImg; uniform vec3 uCamPos, uCamR, uCamU, uCamF; uniform float uTanH, uAspect, uOpen;
` + BREAK_COMMON + `
void main(){
  vec2 ndc=vUv*2.-1.;
  vec3 rd=normalize(uCamF+ndc.x*uTanH*uAspect*uCamR+ndc.y*uTanH*uCamU), ro=uCamPos;
  float t=(-0.55-ro.z)/rd.z; float sd=1e4;
  if(t>0.){ sd=winSD(winUVw((ro+rd*t).xy)); if(sd<0.) discard; }
  vec3 dir=rd; float fz=dot(dir,uF0);
  vec2 suv=vec2(dot(dir,uR0)/(fz*uT0*uA0), dot(dir,uU0)/(fz*uT0))*0.5+0.5;
  vec3 c=(fz>0.&&suv.x>0.&&suv.y>0.&&suv.x<1.&&suv.y<1.)?texture(uImg,suv).rgb:vec3(0.015,0.012,0.01);
  // daylight now falls on the stone around the opening
  c+=vec3(1.,0.84,0.6)*exp(-sd/26.)*0.32*uOpen;
  o=vec4(c,1.);
}`;
// ---------------------------------------------------------------- space: state and building
let SP = null;
function initSpace() {
  const D = window.SPACE;
  SP = {};
  SP.prog = program(VS_QUAD, FS_SPACE); SP.sats = program(VS_SATS, FS_DOT); SP.swarm = program(VS_SWARM, FS_DOT);
  // satellites: six numbers each (radius, inclination, node, angle, rate, class)
  const bin = atob(D.sats), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const f = new Float32Array(bytes.buffer);
  SP.n = D.n;
  SP.satVao = gl.createVertexArray(); gl.bindVertexArray(SP.satVao);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 16);
  SP.emptyVao = gl.createVertexArray();
  gl.bindVertexArray(null);
  SP.black = tex2D(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4), gl.NEAREST, gl.CLAMP_TO_EDGE, false);
  SP.earthTex = tex2D(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 40, 90, 255]), gl.LINEAR, gl.CLAMP_TO_EDGE, false);
  loadImg(D.earth).then(im => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const px = x.getImageData(0, 0, im.width, im.height).data; SP.earthTex = tex2D(im.width, im.height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(px.buffer), gl.LINEAR, gl.REPEAT, false); });
}

// ---------------------------------------------------------------- the land: textures
let LD = null;
function texFromImage(im, wrap) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, im);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.generateMipmap(gl.TEXTURE_2D);
  const e = gl.getExtension('EXT_texture_filter_anisotropic'); if (e) gl.texParameterf(gl.TEXTURE_2D, e.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  return t;
}
function initLand() {
  const D = window.LAND;
  LD = { D, prog: program(VS_QUAD, FS_LAND), motes: program(VS_MOTE, FS_DOT), pane: program(VS_PANE, FS_PANE), frame: program(VS_QUAD, FS_FRAME) };
  const sky = tex2D(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([214, 206, 168, 255]), gl.LINEAR, gl.CLAMP_TO_EDGE, false);
  const zero = tex2D(1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]), gl.LINEAR, gl.CLAMP_TO_EDGE, false);
  LD.t = { back: sky, sea: zero, midC: zero, midA: zero, nearC: zero, nearA: zero };
  const load = (key, src) => loadImg(src).then(im => { LD.t[key] = texFromImage(im, (key === 'back' || key === 'sea') ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE); });
  load('back', D.back); load('sea', D.sea); load('midC', D.mid.c); load('midA', D.mid.a); load('nearC', D.near.c); load('nearA', D.near.a);
  // world depths of the layers behind the window (the glass stands at z = -0.55, you stand at z of about +10)
  LD.Z = [-0.55 - 18, -0.55 - 42, -0.55 - 115];
  LD.vao = gl.createVertexArray(); LD.buf = gl.createBuffer(); LD.cap = 0;
  gl.bindVertexArray(LD.vao); gl.bindBuffer(gl.ARRAY_BUFFER, LD.buf);
  const st = 13 * 4;
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, st, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, st, 36);
  gl.bindVertexArray(null);
}

// ---------------------------------------------------------------- the panes of the companies' window
// window pixel (1600 x 1100) <-> world, on the glass plane
const WPX = (u, v) => [(u / 1600 - 0.5) * 6, 4.1625 - (v / 1100 - 0.5) * 4.125, -0.55];
const PAINT = { cx: (843.5 - 43 - 800) / 1600 * 6, cy: 4.1625, hx: 1687 / 1600 * 3, hy: 2.0625 };   // the whole painting, on the glass plane
let PANES = null;
function buildPanes() {
  const n = ROSE_OFF, sid = W.sid, GWp = 1600, GHp = 1100;
  const x0 = new Int32Array(n).fill(1e9), y0 = new Int32Array(n).fill(1e9), x1 = new Int32Array(n).fill(-1), y1 = new Int32Array(n).fill(-1);
  for (let y = 0; y < GHp; y++) for (let x = 0; x < GWp; x++) { const id = sid[y * GWp + x]; if (id >= n) continue;
    if (x < x0[id]) x0[id] = x; if (x > x1[id]) x1[id] = x; if (y < y0[id]) y0[id] = y; if (y > y1[id]) y1[id] = y; }
  const r = mulberry32(31), list = [];
  // the light breaks in where the Sun stands in the painting
  const su = (LAND.sun[0] * 1687 - 43), sv = LAND.sun[1] * 1100;
  for (let id = 0; id < n; id++) {
    if (x1[id] < 0) continue;
    const bx0 = x0[id] - 1, by0 = y0[id] - 1, bx1 = x1[id] + 2, by1 = y1[id] + 2;
    const c = WPX((bx0 + bx1) / 2, (by0 + by1) / 2);
    const corners = [[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]].map(([u, v]) => { const w = WPX(u, v); return [w[0] - c[0], w[1] - c[1]]; });
    const size = Math.hypot(corners[0][0], corners[0][1]);
    const d = 0.45 * Math.hypot(((bx0 + bx1) / 2 - su) / 1100, ((by0 + by1) / 2 - sv) / 1100) + 0.4 * r() + 0.9 * Math.min(1, Math.sqrt((bx1 - bx0) * (by1 - by0)) / 260);
    list.push({ id, c, corners, size, d, rel: -1,
      v0: [(r() - 0.5) * 0.7, 0.3 + r() * 0.9, 0.5 + r() * 1.3],
      ax: norm([r() - 0.5, r() - 0.5, (r() - 0.5) * 0.5]), w: (1.2 + r() * 3.6) * (r() < 0.5 ? -1 : 1) * clamp(0.35 / Math.max(size, 0.05), 0.6, 2.2),
      spin: r() * 6.283 });
  }
  PANES = { list, arr: new Float32Array(list.length * 6 * 13) };
}
function rotM(ax, th) { const [x, y, z] = ax, c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; }
const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
const mm = (A, B) => { const o = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return o; };
const G = 9.81;   // metres, seconds: real gravity
let firstBreak = false, lastCrack = 0, lastLand = 0;
function paneState(P, t) {
  // in flight: thrown out of the lead, tumbling, falling; then lying on the floor
  const vy = P.v0[1], y0 = P.c[1], tl = (vy + Math.sqrt(vy * vy + 2 * G * (y0 - 0.03))) / G;
  if (t < tl) {
    return { landed: false, pos: [P.c[0] + P.v0[0] * t, y0 + vy * t - 0.5 * G * t * t, P.c[2] + P.v0[2] * t], M: rotM(P.ax, P.w * t), away: clamp(t * 4, 0, 1) };
  }
  // lying flat where it landed, face up
  const flat = mm(rotM([0, 1, 0], P.spin), [1, 0, 0, 0, 0, 1, 0, -1, 0]);
  return { landed: true, pos: [P.c[0] + P.v0[0] * tl, 0.012, P.c[2] + P.v0[2] * tl], M: flat, away: 1 };
}
function drawPanes(front) {
  if (!PANES) buildPanes();
  const arr = PANES.arr; let n = 0; const items = [], freed = [], landed = [];
  for (const P of PANES.list) {
    const due = front > P.d;
    if (due && P.rel < 0) { P.rel = clock; P.down = false; freed.push(P); } if (!due) { P.rel = -1; P.down = false; }
    const t = P.rel < 0 ? 0 : clock - P.rel;
    let st;
    if (P.rel < 0) {
      // about to go: a shiver in the lead
      const near = clamp(1 - (P.d - front) / 0.05, 0, 1);
      const j = near * 0.0025; st = { pos: [P.c[0] + (Math.sin(clock * 90 + P.id) * j), P.c[1] + Math.cos(clock * 77 + P.id) * j, P.c[2]], M: [1, 0, 0, 0, 1, 0, 0, 0, 1], away: 0, shiver: near * near };
    } else { st = paneState(P, t); st.shiver = 0; if (st.landed && !P.down) { P.down = true; if (t < 6) landed.push(P); } }
    const v = [st.pos[0] - lc.pos[0], st.pos[1] - lc.pos[1], st.pos[2] - lc.pos[2]];
    items.push({ P, st, z: v[0] * lc.F[0] + v[1] * lc.F[1] + v[2] * lc.F[2] });
  }
  items.sort((a, b) => b.z - a.z);
  // what the breaking sounds like
  if (freed.length) {
    const pan = freed.reduce((a, P) => a + P.c[0], 0) / freed.length / 3;
    if (!firstBreak) { firstBreak = true; shatter(1, pan, 0); lastCrack = clock; }
    else if (clock - lastCrack > 0.16) { lastCrack = clock; shatter(Math.min(0.55, 0.1 + 0.03 * freed.length), pan, 0); }
  }
  if (landed.length && clock - lastLand > 0.12) { lastLand = clock; const P = landed[0]; shatter(Math.min(0.4, 0.1 + 0.05 * landed.length + P.size * 0.2), P.c[0] / 3, 0); }
  for (const { P, st } of items) {
    const N = mv(st.M, [0, 0, 1]);
    const W4 = P.corners.map(q => { const o = mv(st.M, [q[0], q[1], 0]); return [st.pos[0] + o[0], st.pos[1] + o[1], st.pos[2] + o[2]]; });
    const R4 = P.corners.map(q => [P.c[0] + q[0], P.c[1] + q[1], P.c[2]]);
    for (const k of [0, 1, 2, 0, 2, 3]) { arr.set(W4[k], n); arr.set(R4[k], n + 3); arr.set(N, n + 6); arr[n + 9] = P.id; arr[n + 10] = st.away; arr[n + 11] = st.shiver; arr[n + 12] = 0; n += 13; }
  }
  const pr = LD.pane, u = pr.u; gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, rw, rh);
  landUniforms(u); breakUniforms(u);
  bindT(0, chapelOut.t); gl.uniform1i(u.uImg, 0); bindT(1, idTex); gl.uniform1i(u.uSid, 1);
  gl.uniform3f(u.uLightP, 0, 4.4, -4);
  gl.bindVertexArray(LD.vao); gl.bindBuffer(gl.ARRAY_BUFFER, LD.buf);
  if (LD.cap < arr.length) { gl.bufferData(gl.ARRAY_BUFFER, arr.byteLength, gl.STREAM_DRAW); LD.cap = arr.length; }
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr, 0, n);
  gl.drawArrays(gl.TRIANGLES, 0, n / 13);
  gl.bindVertexArray(null);
}
function drawFrame(open) {
  const pr = LD.frame, u = pr.u; gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, rw, rh);
  landUniforms(u); breakUniforms(u); gl.uniform1f(u.uOpen, open);
  bindT(0, chapelOut.t); gl.uniform1i(u.uImg, 0);
  drawQuad();
}

// ---------------------------------------------------------------- the camera beyond the glass
// it begins exactly where the chapel's camera stood, so the painting behind lines up with the glass picture of it
const brk = { m0: 1, pos: [0, 2, 10], F: [0, 0, -1], R: [1, 0, 0], U: [0, 1, 0], tanH: 0.5, A: 1.6, aimF: [0, 0, -1], zf: 0.6, sunW: [0, 0, -100] };
function captureBreak() {
  brk.pos = cam.pos.slice(); brk.F = cam.F.slice(); brk.R = cam.R.slice(); brk.U = cam.U.slice(); brk.tanH = cam.tanH; brk.A = rw / rh;
  // aim at the heart of the window and narrow the view until the glass fills it: the stone slides out of frame
  const aim = [0, 3.75, -0.55], F = norm(aim.map((v, i) => v - brk.pos[i])), R = norm(cross(F, [0, 1, 0])), U = cross(R, F);
  let m = 1e9;
  for (const [x, y] of [[-2.8, 2.25], [2.8, 2.25], [-2.8, 5.15], [2.8, 5.15]]) {
    const v = [x - brk.pos[0], y - brk.pos[1], -0.55 - brk.pos[2]], z = v[0] * F[0] + v[1] * F[1] + v[2] * F[2];
    m = Math.min(m, Math.abs(v[0] * R[0] + v[1] * R[1] + v[2] * R[2]) / (z * brk.tanH * brk.A), Math.abs(v[0] * U[0] + v[1] * U[1] + v[2] * U[2]) / (z * brk.tanH));
  }
  brk.aimF = F; brk.zf = Math.min(m * 0.97, 0.78);
  // how fast the chapel camera was closing in at the moment the glass went (log-scale per unit of scroll),
  // so the zoom that takes over starts at exactly that speed: no kink, no pause
  const dEnd = 1.22, ddp = 0.4 * 2 / (P_REL0 - 2.3), dzdd = dEnd > 1 ? 2.6 : 10.4, dist = (dEnd > 1 ? 4.6 - (dEnd - 1) * 2.6 : 15 - 10.4 * dEnd) + 0.55;
  brk.m0 = clamp((dzdd * ddp / dist) * (P_ZOOM - P_REL0) / -Math.log(brk.zf), 0, 3);
  // the Sun of the painting, on its farthest layer
  const Zb = LD.Z[2], r = (brk.pos[2] - Zb) / (brk.pos[2] + 0.55), su = LAND.sun;
  const cx = brk.pos[0] + (PAINT.cx - brk.pos[0]) * r, cy = brk.pos[1] + (PAINT.cy - brk.pos[1]) * r;
  brk.sunW = [cx + (su[0] - 0.5) * 2 * PAINT.hx * r, cy + (0.5 - su[1]) * 2 * PAINT.hy * r, Zb];
  brk.sunR = 0.024 * 2 * PAINT.hy * r;       // the painted disc's radius on that layer
  brk.sunNdc = sunHandoff();
}
const sunRise = p => 1.12 * ease(seg(p, P_FLY, 4.7));          // in sun-radii above where Bruegel set it
const sunWAt = p => [brk.sunW[0], brk.sunW[1] + sunRise(p) * brk.sunR, brk.sunW[2]];
const lc = { pos: [0, 0, 0], F: [0, 0, -1], R: [1, 0, 0], U: [0, 1, 0], tanH: 0.45, A: 1.6 };
const P_REL0 = 2.62, P_REL1 = 3.45, P_ZOOM = 3.5, P_GLIDE = 4.15;
function landCam(p) {
  const b = brk;
  let pos = b.pos.slice(), F = b.F.slice(), th = b.tanH;
  // 1. look into the opening, narrowing onto it
  const zs = seg(p, P_REL0, P_ZOOM), z1 = (zs * zs * zs - 2 * zs * zs + zs) * b.m0 + (3 * zs * zs - 2 * zs * zs * zs);   // starts at the dolly's speed, eases to rest
  F = norm(mix3(b.F, b.aimF, z1)); th = b.tanH * Math.pow(b.zf, z1);
  // 2. through the opening and out over the land: the shore and the ploughman slide away beneath,
  //    the ship and the islands drift past, the far coast barely moves
  const g = seg(p, 3.3, P_GLIDE), ge = g * g * (3 - 2 * g);
  const gF = norm(mix3(b.aimF, norm(b.sunW.map((v, i) => v - b.pos[i])), 0.45));
  const sW = sunWAt(p), sEnd = sunWAt(P_WHITE);
  const dist = (b.pos[2] + 7.5) / -gF[2];
  pos = add(b.pos, mul(gF, dist * ge));
  F = norm(mix3(F, gF, ease(seg(g, 0.1, 0.9))));
  // once past the glass the view opens wide again
  const free = ease(seg(p, 3.55, 3.9));
  F = norm(add(F, add(mul(brk.R, cam.sx * 0.03 * free), mul(brk.U, -cam.sy * 0.02 * free))));
  pos = add(pos, mul(brk.R, Math.sin(clock * 0.11) * 0.08 * free)); pos[1] += Math.sin(clock * 0.17) * 0.05 * free;
  // 3. into the Sun: turn to it and fly, faster and faster, until it fills the sky
  const f = seg(p, P_FLY, P_WHITE);
  const start = pos.slice(), goal = add(start, mul(sEnd.map((v, i) => v - start[i]), 0.86));
  pos = mix3(start, goal, Math.pow(f, 2.3));
  const toSun = norm(sW.map((v, i) => v - pos[i]));
  F = norm(mix3(F, toSun, ease(seg(p, 3.95, 4.5))));
  if (f > 0) { const dEnd = Math.hypot(...sEnd.map((v, i) => v - goal[i])), thEnd = Math.min(th, (b.sunR / dEnd) / 0.2); th = th * Math.pow(thEnd / th, Math.pow(f, 1.6)); }
  const R = norm(cross(F, [0, 1, 0])), U = cross(R, F);
  lc.pos = pos; lc.F = F; lc.R = R; lc.U = U; lc.tanH = th; lc.A = rw / rh;
}
function landUniforms(u) {
  gl.uniform3fv(u.uCamPos, lc.pos); gl.uniform3fv(u.uCamR, lc.R); gl.uniform3fv(u.uCamU, lc.U); gl.uniform3fv(u.uCamF, lc.F);
  gl.uniform1f(u.uTanH, lc.tanH); gl.uniform1f(u.uAspect, lc.A); if (u.uTime) gl.uniform1f(u.uTime, clock); if (u.uRes) gl.uniform2f(u.uRes, rw, rh);
}
function breakUniforms(u) {
  gl.uniform3fv(u.uC0, brk.pos); gl.uniform3fv(u.uR0, brk.R); gl.uniform3fv(u.uU0, brk.U); gl.uniform3fv(u.uF0, brk.F);
  gl.uniform1f(u.uT0, brk.tanH); gl.uniform1f(u.uA0, brk.A);
}
function renderLand(p) {
  const w = rw, h = rh, D = LD.D;
  const f = seg(p, P_FLY, P_WHITE);
  let pr = LD.prog, u = pr.u; gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, sceneF.f); gl.viewport(0, 0, w, h);
  landUniforms(u);
  const T = LD.t;
  bindT(0, T.back); gl.uniform1i(u.uBack, 0); bindT(1, T.midC); gl.uniform1i(u.uMidC, 1); bindT(2, T.midA); gl.uniform1i(u.uMidA, 2);
  bindT(3, T.nearC); gl.uniform1i(u.uNearC, 3); bindT(4, T.nearA); gl.uniform1i(u.uNearA, 4); bindT(5, T.sea); gl.uniform1i(u.uSea, 5);
  gl.uniform4fv(u.uMidBox, D.mid.box); gl.uniform4fv(u.uNearBox, D.near.box); gl.uniform3fv(u.uZ, LD.Z); gl.uniform3fv(u.uSunW, sunWAt(p));
  gl.uniform3fv(u.uC0, brk.pos); gl.uniform4f(u.uPC, PAINT.cx, PAINT.cy, PAINT.hx, PAINT.hy);
  gl.uniform2f(u.uSunUV, D.sun[0], D.sun[1] - sunRise(p) * 0.024); gl.uniform1f(u.uHorizon, D.horizon); gl.uniform1f(u.uPA, D.aspect);
  gl.uniform1f(u.uSunAng, brk.sunR / Math.hypot(...sunWAt(p).map((v, i) => v - lc.pos[i]))); gl.uniform1f(u.uGlare, 1 + 2.2 * Math.pow(f, 1.6)); gl.uniform1f(u.uWhite, 0.1 * Math.pow(seg(p, 4.55, P_WHITE), 2.0)); gl.uniform1f(u.uLight, 1.85);
  drawQuad();
  // light in the air, once you are out in it
  pr = LD.motes; u = pr.u; gl.useProgram(pr.p); landUniforms(u); gl.uniform1f(u.uPx, renderScale); gl.uniform3fv(u.uSunW, sunWAt(p));
  gl.uniform1f(u.uVis, seg(p, 3.4, 3.8) * (1 - seg(p, 4.6, 4.82)));
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.bindVertexArray(SP.emptyVao); gl.drawArrays(gl.POINTS, 0, 2600); gl.disable(gl.BLEND);
  post(SP.black, 1, 1, null);
}
// how big the painted Sun is on screen at the moment we leave the painting: the real Sun takes its place at that size
function sunHandoff() {
  landCam(P_WHITE);
  const v = sunWAt(P_WHITE).map((x, i) => x - lc.pos[i]), d = Math.hypot(...v);
  return (brk.sunR / d) / lc.tanH;      // radius as a fraction of the half-height of the screen
}
// ---------------------------------------------------------------- space: the camera's path
const EARTH = [170 * Math.cos(0.55), 0, 170 * Math.sin(0.55)];
const scam = { pos: [0, 0, 0], F: [0, 0, -1], R: [1, 0, 0], U: [0, 1, 0], tanH: 0.5 };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function orbitPos(rad, el, az) { return [rad * Math.cos(el) * Math.cos(az), rad * Math.sin(el), rad * Math.cos(el) * Math.sin(az)]; }
const AZ0 = 0.55 + Math.PI * 0.62;
let sunNdcLive = 0;
function sunDist() {
  let f0 = 40; const a = rw / rh; if (a < 1.3) f0 = Math.min(80, f0 * Math.pow(1.3 / a, 0.7));
  const th = Math.tan(f0 * Math.PI / 360), r = clamp((pS < P_WHITE && sunNdcLive) ? sunNdcLive : (brk.sunNdc || 0.25), 0.04, 0.9);
  return Math.max(6.5, 6.0 / Math.sin(Math.atan(r * th)));
}
function spaceKeys(p, t) {
  const s = norm(mul(EARTH, -1)), up = [0, 1, 0], side = norm(cross(s, up));
  const drift = t * 0.02;
  const K = [
    // 3: the painted Sun becomes the real one, at the same place and the same size on the screen
    { at: 2.95, pos: orbitPos(sunDist(), 0.05, AZ0), tgt: [0, 0, 0], fov: 40 },
    // 4: pull away from it until Earth's whole orbit is a ring around it
    { at: 4.0, pos: orbitPos(130, 0.3, AZ0 + 0.12 + drift * 0.5), tgt: [0, 0, 0], fov: 46 },
    // 5: the inner system, where the swarm begins
    { at: 5.0, pos: orbitPos(235, 0.42, 0.55 + Math.PI * 0.62 + drift), tgt: [0, 0, 0], fov: 46 },
    // 6: the shell that cannot stand, the swarm that can
    { at: 6.0, pos: orbitPos(185, 0.28, 0.55 + Math.PI * 0.8 + drift), tgt: [0, 0, 0], fov: 46 },
    // 7: close among the collectors, heat glowing
    { at: 7.0, pos: orbitPos(96, 0.12, 0.55 + Math.PI * 0.95 + drift), tgt: [0, 0, 0], fov: 52 },
    // 8: the path, seen from above
    { at: 8.0, pos: orbitPos(205, 0.75, 0.55 + Math.PI * 1.15 + drift), tgt: [0, 0, 0], fov: 46 },
    // 9: the finale
    { at: 9.0, pos: orbitPos(290, 0.32, 0.55 + Math.PI * 1.3 + drift * 2), tgt: [0, 0, 0], fov: 44 },
  ];
  if (p <= K[0].at) return K[0];
  for (let i = 0; i < K.length - 1; i++) {
    if (p <= K[i + 1].at) { const t2 = ease5(seg(p, K[i].at, K[i + 1].at));
      return { pos: mix3(K[i].pos, K[i + 1].pos, t2), tgt: mix3(K[i].tgt, K[i + 1].tgt, t2), fov: lerp(K[i].fov, K[i + 1].fov, t2) }; }
  }
  return K[K.length - 1];
}
function spaceUniforms(u, w, h) {
  gl.uniform3fv(u.uCamPos, scam.pos); gl.uniform3fv(u.uCamR, scam.R); gl.uniform3fv(u.uCamU, scam.U); gl.uniform3fv(u.uCamF, scam.F);
  gl.uniform1f(u.uTanH, scam.tanH); gl.uniform1f(u.uAspect, w / h); gl.uniform1f(u.uTime, clock); gl.uniform2f(u.uRes, w, h);
  gl.uniform3fv(u.uEarth, EARTH); gl.uniform1f(u.uSunDim, SP.sunDim);
}
function renderSpace(target) {
  const w = rw, h = rh, p = 2.95 + Math.max(0, pS - P_WHITE) * SPACE_RATE;
  const K = spaceKeys(p, clock);
  // a breath of motion and parallax
  const pos = add(K.pos, mul(norm(cross(norm(K.tgt.map((v, i) => v - K.pos[i])), [0, 1, 0])), cam.sx * 0.02 * Math.hypot(...K.pos.map((v, i) => v - K.tgt[i]))));
  scam.pos = pos; scam.F = norm(K.tgt.map((v, i) => v - pos[i])); scam.R = norm(cross(scam.F, [0, 1, 0])); scam.U = cross(scam.R, scam.F);
  let fov = K.fov; if (w / h < 1.3) fov = Math.min(80, fov * Math.pow(1.3 / (w / h), 0.7));
  scam.tanH = Math.tan(fov * Math.PI / 360);
  const grow = Math.pow(ease(seg(p, 4.45, 6.3)), 1.6);
  const shellIn = seg(p, 5.25, 5.55), shellOut = seg(p, 5.85, 6.25);
  SP.sunDim = 1 - 0.42 * grow;
  // the scene
  let pr = SP.prog, u = pr.u; gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, sceneF.f); gl.viewport(0, 0, w, h);
  spaceUniforms(u, w, h); bindT(0, SP.earthTex); gl.uniform1i(u.uEarthTex, 0);
  gl.uniform1f(u.uShell, shellIn * (1 - shellOut)); gl.uniform1f(u.uShellCrack, seg(p, 5.6, 5.95)); gl.uniform1f(u.uGrow, grow);
  drawQuad();
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  // Earth's satellites: fading as we leave
  const satVis = 1 - seg(p, 4.2, 4.9);
  if (satVis > 0.003) { pr = SP.sats; u = pr.u; gl.useProgram(pr.p); spaceUniforms(u, w, h); gl.uniform1f(u.uPx, renderScale); gl.uniform1f(u.uVis, satVis);
    gl.bindVertexArray(SP.satVao); gl.drawArrays(gl.POINTS, 0, SP.n); }
  // Earth's orbit, then the swarm
  pr = SP.swarm; u = pr.u; gl.useProgram(pr.p); spaceUniforms(u, w, h); gl.uniform1f(u.uPx, renderScale);
  gl.bindVertexArray(SP.emptyVao);
  gl.uniform1i(u.uMode, 1); gl.uniform1f(u.uRing, seg(p, 3.6, 4.4)); gl.uniform1f(u.uGrow, 0); gl.uniform1f(u.uIR, 0); gl.drawArrays(gl.POINTS, 0, 2400);
  if (grow > 0.0005) { gl.uniform1i(u.uMode, 0); gl.uniform1f(u.uGrow, grow); gl.uniform1f(u.uIR, 0.08 + 0.35 * seg(p, 6.5, 7.3) * (1 - seg(p, 7.7, 8.3))); gl.drawArrays(gl.POINTS, 0, 300000); }
  gl.disable(gl.BLEND);
  post(SP.black, 1, 1, target);
}
let chapelOut = null;
function ensureChapelOut() {
  if (chapelOut && chapelOut.w === rw && chapelOut.h === rh) return;
  if (chapelOut) { gl.deleteTexture(chapelOut.t); gl.deleteFramebuffer(chapelOut.f); }
  const t = tex2D(rw, rh, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
  const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  chapelOut = { t, f, w: rw, h: rh };
}
// =====================================================================
//   THE SCORE: generated live, following the story
//   chapel: a hushed choir and organ in D minor  ·  the break: a held breath, then air
//   the land: a harp in D major, wind, birds  ·  the flight: rising, brightening
//   space: vast slow chords and bells  ·  the mission: everything at once  ·  the end: home
// =====================================================================
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const ACTS = {
  chapel:  { dur: 8,   cut: 950,  pad: 0.17, bass: 0.13, pluck: 0,    bell: 0.02, wind: 0.012, step: 0,    chords: [[38, 57, 62, 64, 65, 69], [34, 57, 62, 65, 69, 74], [43, 58, 62, 65, 69, 74], [45, 57, 62, 64, 69, 76]] },
  brk:     { dur: 6,   cut: 1700, pad: 0.2,  bass: 0.14, pluck: 0,    bell: 0.05, wind: 0.04,  step: 0,    chords: [[38, 57, 62, 64, 69, 76]] },
  land:    { dur: 4.4, cut: 2300, pad: 0.13, bass: 0.1,  pluck: 0.07, bell: 0,    wind: 0.05,  step: 0.34, chords: [[38, 57, 62, 66, 69, 74], [43, 59, 62, 67, 71, 74], [47, 59, 62, 66, 71, 74], [45, 57, 61, 64, 69, 76]] },
  flight:  { dur: 2.6, cut: 4200, pad: 0.17, bass: 0.12, pluck: 0.07, bell: 0.03, wind: 0.09,  step: 0.17, chords: [[47, 59, 62, 66, 71, 74], [43, 59, 62, 67, 71, 79], [42, 57, 62, 66, 69, 78], [45, 57, 61, 64, 69, 81]] },
  space:   { dur: 9,   cut: 1500, pad: 0.17, bass: 0.12, pluck: 0,    bell: 0.05, wind: 0.02,  step: 0,    chords: [[38, 57, 61, 64, 66, 73], [43, 59, 61, 66, 67, 74], [40, 55, 59, 62, 66, 71], [35, 57, 62, 64, 66, 69]] },
  swarm:   { dur: 6,   cut: 2400, pad: 0.15, bass: 0.12, pluck: 0.05, bell: 0.05, wind: 0.02,  step: 0.21, chords: [[38, 57, 61, 64, 69, 73], [43, 59, 62, 66, 71, 74], [40, 59, 62, 67, 71, 76], [45, 57, 61, 64, 69, 76]] },
  mission: { dur: 7,   cut: 3200, pad: 0.3,  bass: 0.21, pluck: 0,    bell: 0.07, wind: 0.02,  step: 0,    chords: [[38, 57, 62, 66, 69, 74, 78]] },
  finale:  { dur: 9,   cut: 2000, pad: 0.18, bass: 0.13, pluck: 0,    bell: 0.04, wind: 0.015, step: 0,    chords: [[38, 57, 62, 64, 69, 76], [38, 57, 62, 66, 69, 74]] },
};
function actAt(p) {
  if (p < 2.55) return 'chapel'; if (p < 3.35) return 'brk'; if (p < P_FLY) return 'land'; if (p < P_WHITE) return 'flight';
  if (p >= 5.9 && p < 6.85) return 'mission'; if (p >= 7.35) return 'finale'; if (p >= 6.85) return 'swarm'; return 'space';
}
let MX = null, musicOn = true;    // sound is on by default; it plays as soon as the browser allows
function noiseBuf(ac, sec) { const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
function initMusic() {
  const ac = audio(); if (!ac) return null;
  const M = { ac, act: '', chord: 0, nextChord: 0, nextNote: 0, arp: 0, nextBell: 0, nextBird: 0, level: {} };
  // a cathedral of air: a long stereo tail, generated
  const len = Math.floor(ac.sampleRate * 5.5), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (i < 400 ? i / 400 : 1); }
  M.rev = ac.createConvolver(); M.rev.buffer = ir;
  M.comp = ac.createDynamicsCompressor(); M.comp.threshold.value = -18; M.comp.ratio.value = 3;
  M.master = ac.createGain(); M.master.gain.value = 0;
  M.dry = ac.createGain(); M.dry.gain.value = 0.55; M.wet = ac.createGain(); M.wet.gain.value = 0.85;
  M.dry.connect(M.comp); M.rev.connect(M.wet); M.wet.connect(M.comp); M.comp.connect(M.master); M.master.connect(ac.destination);
  M.bus = ac.createGain(); M.bus.connect(M.dry); M.bus.connect(M.rev);
  // the glass goes round the music's compressor, so a break never pushes the music down
  M.sfx = ac.createGain(); M.sfx.gain.value = 1; const sfxRev = ac.createGain(); sfxRev.gain.value = 0.35; M.sfx.connect(M.master); M.sfx.connect(sfxRev); sfxRev.connect(M.rev);
  M.noise = noiseBuf(ac, 1.2); M.voicesUntil = [];
  // the choir: six voices, each two detuned saws and a sine an octave down, gliding from chord to chord
  M.padF = ac.createBiquadFilter(); M.padF.type = 'lowpass'; M.padF.frequency.value = 900; M.padF.Q.value = 0.4;
  M.vowel = ac.createBiquadFilter(); M.vowel.type = 'peaking'; M.vowel.frequency.value = 880; M.vowel.gain.value = 6; M.vowel.Q.value = 1.2;
  M.padG = ac.createGain(); M.padG.gain.value = 0; M.padF.connect(M.vowel); M.vowel.connect(M.padG); M.padG.connect(M.bus);
  M.voices = [];
  for (let v = 0; v < 7; v++) {
    const g = ac.createGain(); g.gain.value = 0.0; g.connect(M.padF);
    const os = [-7, 7].map(c => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.detune.value = c + (Math.random() - 0.5) * 4; o.connect(g); o.start(); return o; });
    const sub = ac.createOscillator(); sub.type = 'sine'; const sg = ac.createGain(); sg.gain.value = 0.6; sub.connect(sg); sg.connect(g); sub.start();
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.12 + Math.random() * 0.15; const lg = ac.createGain(); lg.gain.value = 5; lfo.connect(lg); os.forEach(o => lg.connect(o.detune)); lfo.start();
    M.voices.push({ g, os, sub });
  }
  // the ground: a deep organ note under it all
  M.bassF = ac.createBiquadFilter(); M.bassF.type = 'lowpass'; M.bassF.frequency.value = 240;
  M.bassG = ac.createGain(); M.bassG.gain.value = 0; M.bassF.connect(M.bassG); M.bassG.connect(M.dry); M.bassG.connect(M.rev);
  M.bass = [1, 2, 3].map((h, i) => { const o = ac.createOscillator(); o.type = i ? 'triangle' : 'sine'; const g = ac.createGain(); g.gain.value = [0.9, 0.35, 0.12][i]; o.connect(g); g.connect(M.bassF); o.start(); return { o, h }; });
  // air: wind over the land, a rush in the flight, a hush in space
  M.wind = ac.createBufferSource(); M.wind.buffer = noiseBuf(ac, 3); M.wind.loop = true;
  M.windF = ac.createBiquadFilter(); M.windF.type = 'bandpass'; M.windF.frequency.value = 600; M.windF.Q.value = 0.7;
  M.windG = ac.createGain(); M.windG.gain.value = 0; M.wind.connect(M.windF); M.windF.connect(M.windG); M.windG.connect(M.bus); M.wind.start();
  return M;
}
function pluck(M, f, t, vol, pan, bright) {
  const ac = M.ac, g = ac.createGain(), p = ac.createStereoPanner ? ac.createStereoPanner() : null, lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(bright, t); lp.frequency.exponentialRampToValueAtTime(600, t + 1.4);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([h, ty, a]) => { const o = ac.createOscillator(); o.type = ty; o.frequency.value = f * h; const og = ac.createGain(); og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + 2.3); });
  lp.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(M.bus); } else g.connect(M.bus);
}
function bell(M, f, t, vol, pan) {
  const ac = M.ac, car = ac.createOscillator(), mod = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
  car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 2.5);
  mod.connect(mg); mg.connect(car.frequency); car.connect(g);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
  const p = ac.createStereoPanner ? ac.createStereoPanner() : null; if (p) { p.pan.value = pan; g.connect(p); p.connect(M.bus); } else g.connect(M.bus);
  car.start(t); mod.start(t); car.stop(t + 4.6); mod.stop(t + 4.6);
}
function bird(M, t) {
  const ac = M.ac, n = 2 + Math.floor(Math.random() * 4), base = 2600 + Math.random() * 1600, pan = Math.random() * 1.4 - 0.7;
  for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(), t0 = t + i * (0.09 + Math.random() * 0.05);
    o.frequency.setValueAtTime(base, t0); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t0 + 0.06);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.018, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
    const p = ac.createStereoPanner ? ac.createStereoPanner() : null; o.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(M.bus); } else g.connect(M.bus); o.start(t0); o.stop(t0 + 0.1); }
}
function music(p) {
  if (!musicOn) return;
  if (!MX) { MX = initMusic(); if (!MX) return; }
  const M = MX, ac = M.ac, now = ac.currentTime;
  if (ac.state !== 'running') return;
  const name = actAt(p), A = ACTS[name];
  M.master.gain.setTargetAtTime(soundOn ? 0.62 : 0, now, 0.8);
  // a new act: its first chord, now; within an act, the chords turn over on their own clock
  if (name !== M.act) { M.act = name; M.chord = 0; M.nextChord = now + A.dur; setChord(M, A, now, 1.4); }
  else if (now >= M.nextChord) { M.chord = (M.chord + 1) % A.chords.length; M.nextChord = now + A.dur; setChord(M, A, now, A.dur > 4 ? 1.1 : 0.5); }
  // the swell toward the break, the climb into the Sun
  const lift = name === 'chapel' ? 1 + 0.5 * seg(p, 2.2, 2.55) : name === 'flight' ? 1 + 0.7 * seg(p, P_FLY, P_WHITE) : 1;
  M.padG.gain.setTargetAtTime(A.pad * lift, now, 1.2); M.bassG.gain.setTargetAtTime(A.bass * lift, now, 1.5);
  M.padF.frequency.setTargetAtTime(A.cut * (name === 'flight' ? 1 + seg(p, P_FLY, P_WHITE) : 1), now, 1.2);
  M.windG.gain.setTargetAtTime(A.wind, now, 1.2);
  M.windF.frequency.setTargetAtTime(name === 'flight' ? 900 + 3200 * seg(p, P_FLY, P_WHITE) : name === 'land' ? 520 + 180 * Math.sin(now * 0.31) : 380, now, 0.6);
  // harp over the land, a quick rising arpeggio in the flight, glittering in the swarm
  if (A.step > 0) {
    if (M.nextNote < now) M.nextNote = now + 0.05;
    while (M.nextNote < now + 0.2) {
      const ch = A.chords[M.chord], tones = ch.slice(1), n = tones.length;
      const up = name === 'flight' ? M.arp % (n * 2) : M.arp % (2 * n - 2);
      const idx = name === 'flight' ? up % n : (up < n ? up : 2 * n - 2 - up);
      const oct = name === 'flight' ? Math.floor(up / n) * 12 : name === 'swarm' ? 12 : 0;
      const f = mtof(tones[idx] + oct);
      if (name === 'swarm') bell(M, f, M.nextNote, A.pluck * 0.6, Math.sin(M.arp * 0.9) * 0.6);
      else pluck(M, f, M.nextNote, A.pluck * (M.arp % n === 0 ? 1.15 : 0.85), Math.sin(M.arp * 1.3) * 0.5, name === 'flight' ? 5200 : 3200);
      const swing = name === 'land' && M.arp % 2 ? 1.12 : 0.88;
      M.nextNote += A.step * (name === 'land' ? swing : 1); M.arp++;
    }
  } else M.nextNote = now;
  // bells: a deep one now and then in the chapel, high and far in space
  if (A.bell > 0 && now >= M.nextBell) {
    const ch = A.chords[M.chord], m = ch[1 + Math.floor(Math.random() * (ch.length - 1))];
    bell(M, mtof(m + (name === 'chapel' ? -12 : 12)), now + 0.05, A.bell, Math.random() * 1.2 - 0.6);
    M.nextBell = now + (name === 'chapel' ? 6 + Math.random() * 6 : 2.5 + Math.random() * 4);
  }
  if (name === 'land' && now >= M.nextBird) { bird(M, now + 0.05); M.nextBird = now + 2 + Math.random() * 4.5; }
}
function setChord(M, A, now, glide) {
  const ch = A.chords[M.chord];
  M.bass.forEach(b => b.o.frequency.setTargetAtTime(mtof(ch[0]) * b.h, now, glide));
  M.voices.forEach((v, i) => {
    const m = ch[1 + i];
    if (m === undefined) { v.g.gain.setTargetAtTime(0, now, glide); return; }
    const f = mtof(m); v.os.forEach(o => o.frequency.setTargetAtTime(f, now, glide)); v.sub.frequency.setTargetAtTime(f / 2, now, glide);
    v.g.gain.setTargetAtTime(0.2 / Math.sqrt(ch.length - 1), now, glide * 1.5);
  });
}

// ---------------------------------------------------------------- the sound of glass breaking
// a crack, the burst of the pane, then the small bright pieces raining down
function shatter(intensity, pan, delay) {
  if (!soundOn) return; const ac = audio(); if (!ac || ac.state !== 'running') return;
  if (!MX) MX = initMusic(); if (!MX) return; const out = MX.sfx;
  const t = ac.currentTime + 0.01 + (delay || 0), I = clamp(intensity, 0.05, 1);
  // never more than a few breaks sounding at once: the audio stays smooth
  MX.voicesUntil = MX.voicesUntil.filter(e => e > ac.currentTime);
  if (MX.voicesUntil.length >= (I > 0.8 ? 8 : 4)) return;
  MX.voicesUntil.push(t + 0.4 + 1.3 * I);
  const NB = MX.noise, nOff = Math.random() * 0.2;
  const P = (node) => { if (ac.createStereoPanner) { const s = ac.createStereoPanner(); s.pan.value = clamp(pan, -0.9, 0.9); node.connect(s); s.connect(out); } else node.connect(out); };
  // the crack
  { const src = ac.createBufferSource(); src.buffer = NB; const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const g = ac.createGain(); g.gain.setValueAtTime(0.5 * I, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.025); src.connect(hp); hp.connect(g); P(g); src.start(t, nOff, 0.04); }
  // the burst: noise through a ring of resonances, the glass singing as it goes
  { const dur = 0.25 + 0.6 * I, src = ac.createBufferSource(); src.buffer = NB;
    const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.0 * I, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500; src.connect(hp);
    for (let k = 0; k < (I > 0.6 ? 5 : 3); k++) { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2800 + Math.random() * 7000; bp.Q.value = 8 + Math.random() * 25; hp.connect(bp); bp.connect(g); }
    P(g); src.start(t, nOff, dur); }
  // weight
  if (I > 0.4) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    g.gain.setValueAtTime(0.28 * I, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g); P(g); o.start(t); o.stop(t + 0.4); }
  // the rain of pieces
  const n = Math.round(3 + 15 * I);
  for (let k = 0; k < n; k++) {
    const tk = t + 0.02 + Math.pow(Math.random(), 1.8) * (0.4 + 1.3 * I), f = 2200 + Math.random() * 6500;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f;
    const v = (0.02 + 0.05 * Math.random()) * (0.5 + 0.5 * I);
    g.gain.setValueAtTime(0, tk); g.gain.linearRampToValueAtTime(v, tk + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, tk + 0.04 + Math.random() * 0.14);
    o.connect(g); P(g); o.start(tk); o.stop(tk + 0.2);
  }
}

// ---------------------------------------------------------------- sound: on by default
// browsers hold back sound until the visitor first clicks, taps or presses a key; until then the button invites a tap
const sndBtn = document.getElementById('snd');
let sndShown = '';
function sndState() { const ac = actx; return !soundOn ? 'off' : (ac && ac.state === 'running') ? 'on' : 'wait'; }
function setSndLabel() {
  if (!sndBtn) return; const st = sndState(); if (st === sndShown) return; sndShown = st;
  sndBtn.classList.toggle('on', st === 'on'); sndBtn.classList.toggle('wait', st === 'wait');
  sndBtn.querySelector('span').textContent = st === 'on' ? 'Sound on' : st === 'wait' ? 'Tap for sound' : 'Sound off';
}
function startSound() { const ac = audio(); if (ac && ac.state !== 'running') ac.resume().then(setSndLabel, () => {}); musicOn = true; soundOn = true; setSndLabel(); }
if (sndBtn) sndBtn.addEventListener('click', e => { e.stopPropagation(); if (sndState() === 'on') soundOn = false; else startSound(); setSndLabel(); });
// try at once (some browsers allow it), and again on every kind of first touch
try { audio(); if (actx && actx.state !== 'running') actx.resume().then(setSndLabel, () => {}); } catch (e) {}
const unlock = e => {
  if (e && e.target && e.target.closest && e.target.closest('#snd')) return;
  if (soundOn) startSound();
  if (actx && actx.state === 'running') ['pointerdown', 'keydown', 'touchend', 'mousedown', 'wheel'].forEach(t => window.removeEventListener(t, unlock, true));
};
['pointerdown', 'keydown', 'touchend', 'mousedown', 'wheel'].forEach(t => window.addEventListener(t, unlock, true));
setInterval(setSndLabel, 400);

// ---------------------------------------------------------------- the order of things
let snapValid = false, spaceOut = null, XF = null;
function ensureSpaceOut() {
  if (!XF) XF = program(VS_QUAD, HDR + `in vec2 vUv; out vec4 o; uniform sampler2D uT; uniform float uA; void main(){ o=vec4(texture(uT,vUv).rgb,uA); }`);
  if (spaceOut && spaceOut.w === rw && spaceOut.h === rh) return;
  if (spaceOut) { gl.deleteTexture(spaceOut.t); gl.deleteFramebuffer(spaceOut.f); }
  const t = tex2D(rw, rh, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.LINEAR, gl.CLAMP_TO_EDGE, false);
  const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  spaceOut = { t, f, w: rw, h: rh };
}
SITE.render = dt => {
  if (!SP || !LD) { render(); return; }
  const p = pS;
  if (p < P_REL0) { snapValid = false; firstBreak = false; if (PANES) for (const P of PANES.list) { P.rel = -1; P.down = false; } render(); return; }
  if (p >= P_WHITE) { renderSpace(null); frame++; return; }
  // the chapel's last image, held from the moment the first pane goes
  ensureChapelOut();
  if (!snapValid || exposure < 0.995) { render(chapelOut); captureBreak(); snapValid = exposure >= 0.995; }   // never hold a half-lit chapel
  landCam(p);
  renderLand(p);
  const inside = lc.pos[2] > -0.55;
  if (inside) drawFrame(seg(p, P_REL0, P_REL1));
  // the panes: released one by one as the light reaches them, then falling under real gravity
  if (p < 3.6) drawPanes(seg(p, P_REL0, P_REL1) * 1.95);
  // the painted Sun gives way to the real one, in the same place
  const xf = ease(seg(p, P_WHITE - 0.1, P_WHITE));
  if (xf > 0.001) {
    sunNdcLive = (brk.sunR / Math.hypot(...sunWAt(p).map((v, i) => v - lc.pos[i]))) / lc.tanH;
    ensureSpaceOut(); renderSpace(spaceOut);
    const pr = XF, u = pr.u; gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, rw, rh);
    bindT(0, spaceOut.t); gl.uniform1i(u.uT, 0); gl.uniform1f(u.uA, xf);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); drawQuad(); gl.disable(gl.BLEND);
    landCam(p);
  }
  frame++;
};
// =====================================================================
//   THE FILM: the whole story played on its own, recorded with its sound
//   site.html?film=1     a button starts it; the video downloads at the end
//   site.html?film=auto  starts by itself (for a browser launched to render it)
//   &save=server         sends the finished file back to the local film server
//   &res=1080|1440|2160  frame height (default 1080)
// =====================================================================
const FQ = new URLSearchParams(location.search);
const FILM = { mode: FQ.get('film'), on: false, t0: 0, rec: null, chunks: [], comp: null, ctx: null, dest: null, done: false };
// the camera's timeline: seconds -> story position; holds where the words need time
const FILM_KEYS = [[0, 0], [2.6, 0], [15, 1.0], [20, 1.42], [30, 2.3], [32.5, 2.48], [40, 2.86], [44.5, 3.1], [50, 3.45], [60, 4.15], [69, 4.86], [79.5, 5.62], [92, 6.82], [102, 7.6], [110, 8.55], [114, 8.65]];
const FILM_END = +(new URLSearchParams(location.search).get('end') || 117);   // ?end= renders a short test
function filmP(t) {
  // monotone cubic through the keys: smooth, never overshooting, still at the holds
  const K = FILM_KEYS, n = K.length;
  if (t <= K[0][0]) return K[0][1]; if (t >= K[n - 1][0]) return K[n - 1][1];
  let i = 0; while (t > K[i + 1][0]) i++;
  const d = [], m = [];
  for (let k = 0; k < n - 1; k++) d.push((K[k + 1][1] - K[k][1]) / (K[k + 1][0] - K[k][0]));
  for (let k = 0; k < n; k++) m.push(k === 0 ? d[0] : k === n - 1 ? d[n - 2] : (d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2));
  for (let k = 0; k < n - 1; k++) { if (d[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; } const a = m[k] / d[k], b = m[k + 1] / d[k], s = a * a + b * b; if (s > 9) { const q = 3 / Math.sqrt(s); m[k] = q * a * d[k]; m[k + 1] = q * b * d[k]; } }
  const h = K[i + 1][0] - K[i][0], u = (t - K[i][0]) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * K[i][1] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * K[i + 1][1] + (u3 - u2) * h * m[i + 1];
}
// every sound in the page, music and glass and the clink of each pane, is also sent to the recording
{ const orig = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dst, ...a) { const r = orig.call(this, dst, ...a); if (FILM.dest && dst === FILM.dest.context.destination && dst !== FILM.dest) { try { orig.call(this, FILM.dest); } catch (e) {} } return r; }; }

// ---------------------------------------------------------------- the words, set into the frame
const CSSV = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function runsOf(node, em, out) {
  for (const c of node.childNodes) {
    if (c.nodeType === 3) { if (c.textContent) out[out.length - 1].push({ t: c.textContent.replace(/\s+/g, ' '), em, sup: false }); }
    else if (c.nodeName === 'BR') out.push([]);
    else if (c.nodeName === 'SUP') out[out.length - 1].push({ t: c.textContent, em, sup: true });
    else runsOf(c, em || c.nodeName === 'EM', out);
  }
  return out;
}
function drawBeats(g, W, H) {
  const s = H / 1080, ink = CSSV('--ink') || '#ece2cc', gold = CSSV('--gold2') || '#f1d79a', gold1 = CSSV('--gold') || '#d9b46a';
  const serif = '"Cormorant Garamond", Georgia, serif', sans = 'Inter, system-ui, sans-serif';
  // one block of words: eyebrow, headline lines, small lines; laid out down from a top edge or up from a bottom edge
  const block = (el, al, x, edge, fromBottom, hSize, dark, weight) => {
    const pSize = 30 * s, lh = hSize * 0.98;
    const h2 = el.querySelector('h2'), lines = h2 ? runsOf(h2, false, [[]]).filter(l => l.length && l.some(r => r.t.trim())) : [];
    const ps = [...el.querySelectorAll('p')].map(e => e.textContent.trim()).filter(Boolean);
    const brow = el.querySelector('.eyebrow');
    const blockH = (brow ? 40 * s : 0) + lines.length * lh + ps.length * pSize * 1.5 + (ps.length ? 18 * s : 0);
    let y = fromBottom ? edge - blockH : edge;
    const place = w => al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
    if (brow) { g.font = `500 ${15 * s}px ${sans}`; g.letterSpacing = `${0.5 * 15 * s}px`; g.fillStyle = dark ? '#7a5016' : gold1;
      const t = brow.textContent.trim().toUpperCase(), w = g.measureText(t).width; g.fillText(t, place(w), y + 15 * s); y += 40 * s; g.letterSpacing = '0px'; }
    for (const line of lines) {
      y += lh;
      const font = r => `${r.em ? 'italic ' : ''}${weight} ${r.sup ? hSize * 0.5 : hSize}px ${serif}`;
      let w = 0; for (const r of line) { g.font = font(r); w += g.measureText(r.t).width; }
      let cx = place(w);
      for (const r of line) { g.font = font(r); g.fillStyle = r.em ? (dark ? '#7a4310' : weight === 300 ? '#ead6a6' : gold) : (dark ? '#241a0e' : ink); g.fillText(r.t, cx, r.sup ? y - hSize * 0.38 : y); cx += g.measureText(r.t).width; }
    }
    if (ps.length) y += 18 * s;
    for (const t of ps) { y += pSize * 1.5; g.font = `400 ${pSize}px ${serif}`; g.fillStyle = dark ? '#33271a' : '#d8ccb2'; const w = g.measureText(t).width; g.fillText(t, place(w), y); }
    return blockH;
  };
  for (const B of beats) {
    const o = +B.el.style.opacity || 0; if (o < 0.004) continue;
    const cl = B.el.classList, dark = cl.contains('ink'), big = cl.contains('mission') || cl.contains('impact');
    const ty = (parseFloat((B.el.style.transform.match(/,\s*(-?[\d.]+)px/) || [0, 0])[1]) || 0) * s * 1.6;
    const hSize = (cl.contains('impact') ? 92 : big ? 150 : 104) * s, weight = cl.contains('impact') ? 300 : 400;   // the turn: light and quiet, not shouted
    g.save(); g.globalAlpha = o; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.shadowColor = dark ? 'rgba(255,246,226,0.85)' : 'rgba(0,0,0,0.75)'; g.shadowBlur = (dark ? 28 : (cl.contains('impact') ? 30 : 36)) * s;
    const mh = (el, hs) => { const h2 = el.querySelector('h2'), n = h2 ? runsOf(h2, false, [[]]).filter(l => l.length && l.some(r => r.t.trim())).length : 0;
      const np = el.querySelectorAll('p').length; return (el.querySelector('.eyebrow') ? 40 * s : 0) + n * hs * 0.98 + np * 45 * s + (np ? 18 * s : 0); };
    if (cl.contains('sunline')) {
      // the lede above the Sun; the number below it, light and wide, each group at its own brightness; a hairline; the lede again
      g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 30 * s;
      const lede = (txt, y) => { g.font = `italic 400 ${60 * s}px ${serif}`; g.fillStyle = '#e8dec8'; g.fillText(txt, W / 2, y); };
      const tops = B.el.querySelectorAll('.lede');
      lede(tops[0].textContent.trim(), H * 0.5 - H * 0.2 + ty);
      const gs = [...B.el.querySelectorAll('.big .g')], size = 132 * s, gap = size * 0.32;
      g.font = `300 ${size}px ${serif}`; g.letterSpacing = `${0.04 * size}px`;
      const ws = gs.map(e => g.measureText(e.textContent).width), total = ws.reduce((a, b) => a + b, 0) + gap * (gs.length - 1);
      let x = W / 2 - total / 2; const base = H * 0.5 + H * 0.15 + size * 0.82 + ty;
      g.textAlign = 'left'; g.fillStyle = '#f5eee0';
      gs.forEach((e, i) => { g.globalAlpha = o * (+e.style.opacity || 0); g.fillText(e.textContent, x, base); x += ws[i] + gap; });
      g.letterSpacing = '0px'; g.globalAlpha = o; g.textAlign = 'center';
      g.shadowBlur = 0; g.fillStyle = 'rgba(241,231,210,.55)'; g.fillRect(W / 2 - 28 * s, base + 0.26 * size, 56 * s, Math.max(1, s));
      g.shadowBlur = 30 * s; lede(tops[1].textContent.trim(), base + 0.26 * size + 74 * s);
    } else if (cl.contains('halo')) {
      // close around the Sun: one line just above it, the number just below
      block(B.el.querySelector('.top'), 'center', W / 2, H * 0.5 - H * 0.17 + ty, true, hSize, dark, weight);
      block(B.el.querySelector('.bot'), 'center', W / 2, H * 0.5 + H * 0.17 + ty, false, hSize, dark, weight);
    } else if (cl.contains('flank')) {
      // bookends either side of the swarm
      const hs = 124 * s, a = B.el.querySelector('.top'), b = B.el.querySelector('.bot');
      block(a, 'right', W / 2 - W * 0.2, H * 0.5 - mh(a, hs) / 2 + ty, false, hs, dark, weight);
      block(b, 'left', W / 2 + W * 0.2, H * 0.5 - mh(b, hs) / 2 + ty + 40 * s, false, hs, dark, weight);
    } else if (cl.contains('low')) {
      // one quiet line under the whole system
      const el = B.el.querySelector('.inner') || B.el;
      block(el, 'center', W / 2, H * 0.87 + ty, true, 96 * s, dark, weight);
    } else if (cl.contains('split')) {
      // above the Sun and below it, never across it
      block(B.el.querySelector('.top'), 'center', W / 2, H * 0.09 + ty, false, hSize, dark, weight);
      block(B.el.querySelector('.bot'), 'center', W / 2, H * 0.91 + ty, true, hSize, dark, weight);
    } else {
      const al = cl.contains('left') ? 'left' : cl.contains('right') ? 'right' : 'center';
      const x = al === 'left' ? 150 * s : al === 'right' ? W - 150 * s : W / 2;
      const h2 = B.el.querySelector('h2'), n = h2 ? runsOf(h2, false, [[]]).filter(l => l.length && l.some(r => r.t.trim())).length : 0;
      const np = B.el.querySelectorAll('p').length, bh = (B.el.querySelector('.eyebrow') ? 40 * s : 0) + n * hSize * 0.98 + np * 45 * s + (np ? 18 * s : 0);
      block(B.el, al, x, H * 0.5 - bh / 2 + ty, false, hSize, dark, weight);
    }
    g.restore();
  }
}
function drawFilmFrame() {
  const g = FILM.ctx, W = FILM.comp.width, H = FILM.comp.height, s = H / 1080, t = clock - FILM.t0;
  g.globalAlpha = 1; g.drawImage(canvas, 0, 0, W, H);
  // the Sun's glare that carries one world into the next
  const wo = +white.style.opacity || 0;
  if (wo > 0.003) { const gr = g.createRadialGradient(W * 0.62, H * 0.38, 0, W * 0.62, H * 0.38, W * 0.75); gr.addColorStop(0, '#fffdf6'); gr.addColorStop(0.55, '#fff3dc'); gr.addColorStop(1, '#f7e2bb');
    g.globalAlpha = wo; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  const dmo = +dim.style.opacity || 0;
  if (dmo > 0.003) { const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0.8)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.62)'); gr.addColorStop(1, 'rgba(0,0,0,0.38)');
    g.globalAlpha = dmo; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  drawBeats(g, W, H);
  // the title, over the dark chapel at the start
  const ti = Math.min(seg(t, 0.3, 1.3), 1 - seg(t, 3.0, 4.4));
  if (ti > 0.003) { g.save(); g.globalAlpha = ti; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 40 * s;
    g.fillStyle = CSSV('--gold2') || '#f1d79a'; g.font = `400 ${150 * s}px "Cormorant Garamond", serif`; g.letterSpacing = `${0.02 * 150 * s}px`; g.fillText('The Swarm', W / 2, H * 0.47);
    g.fillStyle = '#e6dcc6'; g.font = `italic 400 ${64 * s}px "Cormorant Garamond", serif`; g.letterSpacing = '0px'; g.fillText('A journey to a Dyson Sphere', W / 2, H * 0.47 + 96 * s); g.restore(); }
  // a quiet mark in the corner
  g.save(); g.globalAlpha = 0.75 * seg(t, 4.2, 5.5) * (1 - seg(t, FILM_END - 6, FILM_END - 3)); g.font = `500 ${14 * s}px Inter, sans-serif`; g.letterSpacing = `${0.4 * 14 * s}px`;
  g.fillStyle = document.body.classList.contains('daylight') ? '#2a1d0f' : (CSSV('--gold2') || '#f1d79a'); g.fillText('THE SWARM', 64 * s, 64 * s); g.restore();
  // fade up from black, and down to it at the end
  const fade = Math.max(1 - seg(t, 0, 1.3), seg(t, FILM_END - 4, FILM_END - 0.5));
  if (fade > 0) { g.globalAlpha = fade; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
}

// ---------------------------------------------------------------- recording
function filmMime() {
  for (const m of ['video/mp4;codecs=avc1.640033,mp4a.40.2', 'video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'])
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  return '';
}
async function startFilm() {
  if (FILM.on) return;
  const H = Math.min(2160, Math.max(720, +(FQ.get('res') || 1080))), W = Math.round(H * 16 / 9);
  // render the scene at the film's own size, whatever the window
  window.FILM_LOCK = true; renderScale = 1; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  document.body.classList.add('filming');
  await document.fonts.load('400 100px "Cormorant Garamond"'); await document.fonts.load('italic 400 100px "Cormorant Garamond"'); await document.fonts.load('500 14px Inter');
  FILM.comp = document.createElement('canvas'); FILM.comp.width = W; FILM.comp.height = H; FILM.ctx = FILM.comp.getContext('2d');
  FILM.comp.id = 'filmView'; document.body.appendChild(FILM.comp);   // what you watch is exactly what is recorded
  startSound();
  const ac = audio(); if (ac && ac.state !== 'running') await ac.resume();
  if (!MX) MX = initMusic();
  FILM.dest = ac.createMediaStreamDestination();
  MX.master.connect(FILM.dest);
  const stream = new MediaStream([...FILM.comp.captureStream(60).getVideoTracks(), ...FILM.dest.stream.getAudioTracks()]);
  const mime = filmMime(); FILM.mime = mime;
  FILM.rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: H >= 2160 ? 45e6 : H >= 1440 ? 28e6 : 16e6, audioBitsPerSecond: 256000 });
  FILM.rec.ondataavailable = e => { if (e.data && e.data.size) FILM.chunks.push(e.data); };
  FILM.rec.onstop = finishFilm;
  // begin in the chapel, everything empty, the windows not yet glazed
  pRaw = pS = 0; for (let s = 0; s < S; s++) { tgt.set[s] = 0; cur.set[s] = 0; }
  FILM.t0 = clock; FILM.on = true; FILM.rec.start(1000);
  const st = document.getElementById('filmStatus'); if (st) st.textContent = 'Recording… ' + (mime.includes('mp4') ? 'MP4' : 'WebM');
}
function filmTick() {
  if (!FILM.on) return;
  const t = clock - FILM.t0;
  pRaw = pS = filmP(t);
  const st = document.getElementById('filmStatus'); if (st) st.textContent = `Recording ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')} / ${Math.floor(FILM_END / 60)}:${String(FILM_END % 60).padStart(2, '0')}`;
  if (MX) MX.master.gain.setTargetAtTime(soundOn ? 0.62 * (1 - seg(t, FILM_END - 5, FILM_END - 0.5)) : 0, MX.ac.currentTime, 0.4);
  if (t >= FILM_END && !FILM.done && FILM.rec) { FILM.done = true; FILM.on = false; FILM.rec.stop(); }
}
async function finishFilm() {
  const ext = FILM.mime.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(FILM.chunks, { type: FILM.mime.split(';')[0] || 'video/webm' });
  const st = document.getElementById('filmStatus');
  if (FQ.get('save') === 'server') {
    if (st) st.textContent = 'Saving…';
    await fetch('/film?ext=' + ext, { method: 'POST', body: blob }).catch(() => {});
    if (st) st.textContent = 'Saved.'; document.title = 'FILM SAVED';
  } else {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'the-swarm.' + ext; document.body.appendChild(a); a.click();
    if (st) st.textContent = 'Done: the-swarm.' + ext;
  }
}

// ---------------------------------------------------------------- the full-quality film
// pass 1, film=video: every frame drawn on a fixed 1/60 s step, the scene at twice the film's size and scaled down,
//   encoded at a high bitrate; takes as long as it takes
// pass 2, film=audio: the same timeline played in real time, recording only the sound
// the film server joins the two into one MP4
async function filmSetup(H, ss) {
  const W = Math.round(H * 16 / 9);
  window.FILM_LOCK = true; renderScale = ss; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  document.body.classList.add('filming');
  await document.fonts.load('400 100px "Cormorant Garamond"'); await document.fonts.load('italic 400 100px "Cormorant Garamond"');
  await document.fonts.load('500 100px "Cormorant Garamond"'); await document.fonts.load('300 100px "Cormorant Garamond"'); await document.fonts.load('italic 500 100px "Cormorant Garamond"'); await document.fonts.load('500 14px Inter');
  FILM.comp = document.createElement('canvas'); FILM.comp.width = W; FILM.comp.height = H;
  FILM.ctx = FILM.comp.getContext('2d', { alpha: false }); FILM.ctx.imageSmoothingEnabled = true; FILM.ctx.imageSmoothingQuality = 'high';
  FILM.comp.id = 'filmView'; document.body.appendChild(FILM.comp);
  pRaw = pS = 0; for (let s = 0; s < S; s++) { tgt.set[s] = 0; cur.set[s] = 0; }
  return { W, H };
}
const say = t => { const st = document.getElementById('filmStatus'); if (st) st.textContent = t; document.title = t; };
async function startFilmVideo() {
  if (FILM.on) return;
  const H = Math.min(2160, Math.max(720, +(FQ.get('res') || 1080))), SS = Math.max(1, +(FQ.get('ss') || 2));
  const { W } = await filmSetup(H, SS);
  soundOn = false; musicOn = false;                        // the picture pass is silent; sound has its own pass
  // fixed quality, not a bitrate budget: every frame gets as many bits as it needs (lower q = finer; 15 is visually lossless)
  const fps = +(FQ.get('fps') || 60), q = +(FQ.get('q') || 15), kf = +(FQ.get('kf') || fps * 2);   // kf: frames between key frames (short for a film that is scrubbed by scrolling)
  const cfg = { codec: 'avc1.640033', width: W, height: H, bitrateMode: 'quantizer', framerate: fps, latencyMode: 'quality', avc: { format: 'avc' } };
  const ok = await VideoEncoder.isConfigSupported(cfg); if (!ok.supported) { say('Encoder not supported'); return; }
  let desc = null, pending = [], sent = 0, part = 0, errored = null; const index = [];
  const enc = new VideoEncoder({
    output: (chunk, meta) => { if (meta && meta.decoderConfig && meta.decoderConfig.description) desc = new Uint8Array(meta.decoderConfig.description);
      const b = new Uint8Array(chunk.byteLength); chunk.copyTo(b); pending.push(b); index.push([chunk.byteLength, chunk.type === 'key' ? 1 : 0, chunk.timestamp]); },
    error: e => { errored = e; } });
  enc.configure(cfg);
  const flush = async () => {
    if (!pending.length) return; const total = pending.reduce((a, b) => a + b.length, 0), buf = new Uint8Array(total); let o = 0;
    for (const b of pending) { buf.set(b, o); o += b.length; } pending = [];
    await fetch('/film/vpart?i=' + (part++), { method: 'POST', body: buf }); sent += total;
  };
  // take the animation clock off the screen's refresh: each frame is a fixed step, however long it takes to draw
  let tick = null; window.requestAnimationFrame = cb => { tick = cb; return 1; };
  await new Promise(r => setTimeout(r, 300));
  // ?from= starts the render part-way in, for checking one moment
  const from = +(FQ.get('from') || 0);
  let vt = last; const n = Math.round((FILM_END - from) * fps), t0 = performance.now();
  FILM.t0 = clock - from; FILM.on = true;
  for (let i = 0; i < n; i++) {
    if (errored) { say('Encoder error: ' + errored.message); return; }
    vt += 1000 / fps; const cb = tick; tick = null; if (cb) cb(vt);
    const fr = new VideoFrame(FILM.comp, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
    enc.encode(fr, { keyFrame: i % kf === 0, avc: { quantizer: q } }); fr.close();
    while (enc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 2));
    if (pending.length >= fps * 2) await flush();
    if (i % 30 === 0) { const el = (performance.now() - t0) / 1000, eta = el / (i + 1) * (n - i - 1);
      say(`Rendering frame ${i + 1} / ${n}  ·  ${Math.round(sent / 1e6)} MB  ·  about ${Math.ceil(eta / 60)} min left`); }
    if (i % 4 === 3) await new Promise(r => setTimeout(r, 0));   // let the page breathe
  }
  await enc.flush(); await flush(); FILM.on = false;
  const b64 = btoa(String.fromCharCode(...desc));
  await fetch('/film/vdone', { method: 'POST', body: JSON.stringify({ width: W, height: H, fps, description: b64, samples: index }) });
  say('FILM VIDEO SAVED');
}
async function startFilmAudio() {
  if (FILM.on) return;
  await filmSetup(720, 1);                                     // the picture here only drives the story; it is not kept
  startSound();
  const ac = audio(); if (ac && ac.state !== 'running') await ac.resume();
  if (!MX) MX = initMusic();
  FILM.dest = ac.createMediaStreamDestination(); MX.master.connect(FILM.dest);
  const mime = MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2') ? 'audio/mp4;codecs=mp4a.40.2' : 'audio/webm;codecs=opus';
  FILM.mime = mime; FILM.audioOnly = true;
  FILM.rec = new MediaRecorder(FILM.dest.stream, { mimeType: mime, audioBitsPerSecond: 320000 });
  FILM.rec.ondataavailable = e => { if (e.data && e.data.size) FILM.chunks.push(e.data); };
  FILM.rec.onstop = async () => {
    const blob = new Blob(FILM.chunks, { type: mime.split(';')[0] });
    say('Saving sound…'); await fetch('/film/audio?ext=' + (mime.includes('mp4') ? 'mp4' : 'webm'), { method: 'POST', body: blob }); say('FILM AUDIO SAVED');
  };
  FILM.t0 = clock; FILM.on = true; FILM.rec.start(1000);
}

if (FILM.mode) {
  document.body.classList.add('film');
  const ui = document.createElement('div'); ui.id = 'filmUI';
  ui.innerHTML = `<button id="filmGo" type="button">Record the film</button><div id="filmStatus">About two minutes, with sound. Keep this tab in front.</div>`;
  document.body.appendChild(ui);
  document.getElementById('filmGo').onclick = () => { document.getElementById('filmGo').remove(); startFilm(); };
}

{ const inner = SITE.render; SITE.render = dt => { inner(dt); if (FILM.on) drawFilmFrame(); }; }
})();
