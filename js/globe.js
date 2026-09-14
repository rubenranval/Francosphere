/* Francosphère — interactive globe (three.js) */

import { state, $, esc } from "./core.js";
import { CONFIG } from "./config.js";
import { data, world, findCountry } from "./api.js";

/* Reads window.THREE, loaded by vendor/three.min.js. Returns null when WebGL is
   unavailable, and the page carries on without a globe. */
/* -------------------------------- globe ------------------------------ */
export function buildGlobe(onPick) {
  var host = $("#globe");
  if (!host || !window.THREE) { $("#globeWrap").classList.add("hidden"); return null; }

  var THREE = window.THREE, RAD = Math.PI / 180, TW = 4096, TH = 2048;
  var cv = document.createElement("canvas"); cv.width = TW; cv.height = TH;
  var ctx = cv.getContext("2d");
  var active = {};
  data.countries.forEach(function (c) { active[c.iso] = c; });

  function centroid(c) {
    if (c.latlng) return { lat: c.latlng[0], lon: c.latlng[1] };
    var f = world[c.iso];
    return f ? { lat: f.c[1], lon: f.c[0] } : null;
  }
  function px(lon, lat) { return [(lon + 180) / 360 * TW, (90 - lat) / 180 * TH]; }
  function unwrap(ring) {                 // keeps polygons continuous across the antimeridian
    var out = [ring[0].slice()], acc = 0, prev = ring[0][0];
    for (var i = 1; i < ring.length; i++) {
      var lon = ring[i][0], d = lon + acc - prev;
      if (d > 180) acc -= 360; else if (d < -180) acc += 360;
      prev = lon + acc; out.push([prev, ring[i][1]]);
    }
    return out;
  }
  function drawFeature(f, fill, stroke, glow) {
    f.g.forEach(function (ring0) {
      var ring = unwrap(ring0), xs = ring.map(function (p) { return px(p[0], 0)[0]; });
      var offs = [0];
      if (Math.max.apply(null, xs) > TW) offs.push(-TW);
      if (Math.min.apply(null, xs) < 0) offs.push(TW);
      offs.forEach(function (off) {
        ctx.beginPath();
        ring.forEach(function (p, i) {
          var q = px(p[0], p[1]);
          if (i) ctx.lineTo(q[0] + off, q[1]); else ctx.moveTo(q[0] + off, q[1]);
        });
        ctx.closePath();
        if (glow) { ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 26; }
        ctx.fillStyle = fill; ctx.fill();
        if (glow) ctx.restore();
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke(); }
      });
    });
  }
  function paint(sel) {
    ctx.fillStyle = "#191919"; ctx.fillRect(0, 0, TW, TH);
    ctx.strokeStyle = "rgba(240,243,244,.045)"; ctx.lineWidth = 1.5;
    for (var lo = -180; lo <= 180; lo += 20) { var a = px(lo, 0); ctx.beginPath(); ctx.moveTo(a[0], 0); ctx.lineTo(a[0], TH); ctx.stroke(); }
    for (var la = -80; la <= 80; la += 20) { var b = px(0, la); ctx.beginPath(); ctx.moveTo(0, b[1]); ctx.lineTo(TW, b[1]); ctx.stroke(); }
    Object.keys(world).forEach(function (k) { if (!active[k]) drawFeature(world[k], "#343436", "#1f1f20"); });
    Object.keys(world).forEach(function (k) { if (active[k] && k !== sel) drawFeature(world[k], "rgba(249,199,15,.82)", "rgba(249,199,15,.95)", "rgba(249,199,15,.55)"); });
    if (sel && world[sel]) drawFeature(world[sel], "#FFDE59", "#ffffff", "rgba(255,222,89,.9)");
    data.countries.forEach(function (c) {                 // territories too small for the outline set
      if (world[c.iso]) return;
      var ct = centroid(c); if (!ct) return;
      var p = px(ct.lon, ct.lat);
      ctx.save(); ctx.shadowColor = "rgba(249,199,15,.7)"; ctx.shadowBlur = 24;
      ctx.fillStyle = c.iso === sel ? "#FFDE59" : "rgba(249,199,15,.9)";
      ctx.beginPath(); ctx.arc(p[0], p[1], 11, 0, 6.2832); ctx.fill(); ctx.restore();
    });
    tex.needsUpdate = true;
  }

  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100); cam.position.z = 3.35;
  var rend;
  try { rend = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (err) { $("#globeWrap").classList.add("hidden"); return null; }
  rend.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.appendChild(rend.domElement);

  var tex = new THREE.CanvasTexture(cv); tex.anisotropy = 8;
  var group = new THREE.Group(); scene.add(group);
  var sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshBasicMaterial({ map: tex }));
  group.add(sphere);
  var glow = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.ShaderMaterial({
    uniforms: { c: { value: 0.34 }, p: { value: 5.4 }, gc: { value: new THREE.Color(0xf9c70f) } },
    vertexShader: "varying vec3 vn;varying vec3 vp;void main(){vn=normalize(normalMatrix*normal);vp=normalize((modelViewMatrix*vec4(position,1.0)).xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: "uniform float c;uniform float p;uniform vec3 gc;varying vec3 vn;varying vec3 vp;void main(){float i=pow(c-dot(vn,-vp),p);gl_FragColor=vec4(gc,1.0)*clamp(i,0.0,1.0)*0.55;}",
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  glow.scale.setScalar(1.11); scene.add(glow);

  function v3(lon, lat, r) {
    var phi = (90 - lat) * RAD, th = (lon + 180) * RAD;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }
  var marks = [];
  data.countries.forEach(function (c) {
    var ct = centroid(c); if (!ct) return;
    var m = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    m.position.copy(v3(ct.lon, ct.lat, 1.012)); group.add(m);
    marks.push({ iso: c.iso, obj: m, pos: m.position.clone(), lat: ct.lat, c: c });
  });

  var lay = $("#labels"); lay.innerHTML = "";
  var labels = marks.map(function (m) {
    var el = document.createElement("button");
    el.type = "button"; el.dataset.iso = m.iso;
    el.className = "pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 " +
      "whitespace-nowrap rounded-pill border border-gold/40 bg-ink-deep/80 px-2 py-0.5 font-display text-[.7rem] " +
      "font-semibold text-gold backdrop-blur transition hover:bg-gold hover:text-ink";
    el.innerHTML = '<i class="h-1.5 w-1.5 rounded-full bg-current"></i>' + esc(m.c.name);
    el.addEventListener("click", function (ev) { ev.stopPropagation(); onPick(m.iso); });
    lay.appendChild(el);
    return { el: el, m: m };
  });

  var target = { x: 0, y: 0 }, auto = true, sel = null, drag = null, moved = 0, hovering = false;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  (function home() {                       // open facing Europe / Africa / MENA
    var h = CONFIG.globeCenter || [16, 14];
    var p = v3(h[1], h[0], 1);
    target.y = -Math.atan2(p.x, p.z);
    target.x = Math.max(-1.05, Math.min(1.05, h[0] * RAD));
    group.rotation.y = target.y; group.rotation.x = target.x;
  })();

  function size() {
    var w = host.clientWidth || 480, h = host.clientHeight || w;
    rend.setSize(w, h);
    rend.domElement.style.width = "100%";
    rend.domElement.style.height = "100%";
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(size).observe(host); else window.addEventListener("resize", size);
  size();

  function pointInRing(lon, lat, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  function hit(uv) {
    var lon = uv.x * 360 - 180, lat = uv.y * 180 - 90, best = null, bd = 8;
    for (var i = 0; i < data.countries.length; i++) {
      var c = data.countries[i], f = world[c.iso];
      if (f) { for (var r = 0; r < f.g.length; r++) if (pointInRing(lon, lat, f.g[r])) return c.iso; }
      else {
        var ct = centroid(c);
        if (ct) { var d = Math.hypot(lon - ct.lon, lat - ct.lat); if (d < bd) { bd = d; best = c.iso; } }
      }
    }
    return best;
  }
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickCountry(cx, cy) {
    var r = host.getBoundingClientRect();
    ndc.x = ((cx - r.left) / r.width) * 2 - 1;
    ndc.y = -((cy - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, cam);
    var it = ray.intersectObject(sphere);
    return (it.length && it[0].uv) ? hit(it[0].uv) : null;
  }

  host.addEventListener("pointerenter", function () { hovering = true; });
  host.addEventListener("pointerleave", function () { hovering = false; });
  host.addEventListener("pointerdown", function (e) {
    drag = { x: e.clientX, y: e.clientY, rx: group.rotation.x, ry: group.rotation.y };
    moved = 0; host.classList.add("cursor-grabbing"); host.setPointerCapture(e.pointerId);
  });
  host.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    target.y = drag.ry + dx * 0.0055;
    target.x = Math.max(-1.15, Math.min(1.15, drag.rx + dy * 0.0045));
  });
  host.addEventListener("pointerup", function (e) {
    host.classList.remove("cursor-grabbing");
    if (drag && moved < 6) onPick(pickCountry(e.clientX, e.clientY), true);
    drag = null;
  });
  host.addEventListener("pointercancel", function () { drag = null; host.classList.remove("cursor-grabbing"); });

  function spin() {
    requestAnimationFrame(spin);
    if (auto && !drag && !sel && !reduce && !hovering) target.y += 0.00048;
    group.rotation.y += (target.y - group.rotation.y) * (drag ? 0.55 : 0.075);
    group.rotation.x += (target.x - group.rotation.x) * 0.075;
    group.updateMatrixWorld();

    var r = host.getBoundingClientRect(), camDir = cam.position.clone().normalize(), i, k;
    for (i = 0; i < labels.length; i++) {
      var L = labels[i], wp = L.m.pos.clone().applyMatrix4(group.matrixWorld);
      L.f = wp.clone().normalize().dot(camDir);
      var p = wp.clone().project(cam);
      L.x = (p.x * 0.5 + 0.5) * r.width;
      L.y = (-p.y * 0.5 + 0.5) * r.height - 15;
      if (!L.w) L.w = L.el.offsetWidth || 92;
      L.m.obj.scale.setScalar(1 + (L.m.iso === sel ? 1.1 : 0) + (reduce ? 0 : Math.sin(Date.now() / 420 + i) * 0.07));
    }
    var order = labels.slice().sort(function (a, b) {
      return (b.m.iso === sel ? 9 : b.f) - (a.m.iso === sel ? 9 : a.f);
    });
    var placed = [];
    for (i = 0; i < order.length; i++) {                 // de-clutter: skip labels that would overlap
      var Q = order[i], o = Q.f > 0.14 ? Math.min(1, (Q.f - 0.14) * 5) : 0;
      if (o > 0 && Q.m.iso !== sel) {
        for (k = 0; k < placed.length; k++) {
          if (Math.abs(placed[k].x - Q.x) < (placed[k].w + Q.w) / 2 + 8 && Math.abs(placed[k].y - Q.y) < 26) { o = 0; break; }
        }
      }
      if (o > 0) placed.push(Q);
      Q.el.style.left = Q.x + "px";
      Q.el.style.top = Q.y + "px";
      Q.el.style.opacity = o;
      Q.el.style.pointerEvents = o > 0.5 ? "auto" : "none";
    }
    rend.render(scene, cam);
  }
  paint(null); spin();

  return {
    select: function (iso, fly) {
      sel = iso; paint(iso); auto = !iso;
      if (!iso || !fly) return;
      for (var i = 0; i < marks.length; i++) {
        if (marks[i].iso !== iso) continue;
        var m = marks[i], want = -Math.atan2(m.pos.x, m.pos.z);
        want += Math.round((target.y - want) / (2 * Math.PI)) * 2 * Math.PI;
        target.y = want;
        target.x = Math.max(-1.05, Math.min(1.05, m.lat * RAD));
      }
    },
    relabel: function () {
      labels.forEach(function (L) {
        var c = findCountry(L.m.iso) || L.m.c;
        L.el.innerHTML = '<i class="h-1.5 w-1.5 rounded-full bg-current"></i>' + esc(c.name);
        L.w = 0;
      });
    }
  };
}
