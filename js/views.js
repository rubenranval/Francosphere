/* Francosphère — rendering */

import { state, $, $$, esc } from "./core.js";
import { CONFIG } from "./config.js";
import { ui, pick } from "./i18n.js";
import { data, asset, findCountry } from "./api.js";
import { fmtDate, isPast, dt } from "./format.js";
import { eventHref } from "./urls.js";

let globeRef = null;
export function setGlobe(g) { globeRef = g; }

/* A picture that fails to load takes its frame with it, rather than leaving a gap.
   Done with listeners because inline onerror= is blocked by a strict CSP. */
function wireImageFallbacks(root) {
  $$("img[data-drop]", root).forEach(img => {
    img.addEventListener("error", () => {
      const box = img.closest("figure") || img.parentNode;
      if (box && box.remove) box.remove(); else img.remove();
    }, { once: true });
  });
  $$("img[data-wordmark]", root).forEach(img => {
    img.addEventListener("error", () => {
      const name = esc((CONFIG.brand || {}).alt || "Francosphère");
      img.outerHTML = '<span class="font-display text-[1.05rem] font-extrabold tracking-tight">' + name + "</span>";
    }, { once: true });
  });
}

export function renderContent(retry) {
  renderPanel();
  renderLibFilters(); renderLibrary();
  renderEvFilters(); renderEvents();
}

/* ------------------------------- chrome ------------------------------ */
export function renderBrand() {
  var b = CONFIG.brand || {}, name = esc(b.alt || "Francosphère");
  var mark = '<span class="font-display text-[1.05rem] font-extrabold tracking-tight">' + name + "</span>";
  $$("[data-brand]").forEach(function (el) {
    el.innerHTML = b.logo
      ? '<img src="' + esc(b.logo) + '" alt="' + name + '" data-wordmark class="block h-[34px] w-auto">' 
      : mark;
  });
}

export function renderStatic() {
  document.documentElement.lang = state.lang;
  $$("[data-i18n]").forEach(function (el) { el.textContent = ui(el.getAttribute("data-i18n")); });
  $$("[data-i18n-html]").forEach(function (el) { el.innerHTML = ui(el.getAttribute("data-i18n-html")); });
  $$("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)); });
  document.title = ui("meta.title") || "Francosphère";
  $("#year").textContent = "© " + new Date().getFullYear();
  $("#footLinks").innerHTML = (CONFIG.footerLinks || []).map(function (l) {
    var ext = /^https?:/.test(l.url) ? ' target="_blank" rel="noopener"' : "";
    return '<a href="' + esc(l.url) + '"' + ext + ' class="text-paper/60 no-underline hover:text-gold">' +
           esc(pick(l.label)) + "</a>";
  }).join("");
}

/* local photos (hero backdrop, banner, gallery) ship as files next to the page.
   No image, no box: the slot collapses rather than showing a placeholder. */
export function photo(img, aspect) {
  if (!img || !img.src) return "";
  return '<div class="relative overflow-hidden rounded ' + (aspect || "aspect-[16/9]") + '">' +
    '<img src="' + esc(img.src) + '" alt="' + esc(img.alt || "") + '" loading="lazy" data-drop ' +
    'class="absolute inset-0 h-full w-full object-cover"></div>';
}
export function renderPhotos() {
  var im = CONFIG.images || {};
  $("#heroBg").innerHTML = (im.hero && im.hero.src)
    ? '<img src="' + esc(im.hero.src) + '" alt="" data-drop class="hero-photo h-full w-full object-cover opacity-20">'
    : "";
  $("#aboutBanner").innerHTML = photo(im.banner, "aspect-[16/5]");
  $("#gallery").innerHTML = (im.gallery || []).map(function (g) {
    var box = photo(g, "aspect-[4/3]");
    if (!box) return "";
    var cap = pick(g.caption);
    return "<figure class='m-0'>" + box +
      (cap ? "<figcaption class='mt-2.5 font-mono text-[.7rem] tracking-wide text-paper/60'>" + esc(cap) + "</figcaption>" : "") +
      "</figure>";
  }).join("");
}

/* ------------------------------ skeletons ---------------------------- */
export function skeletonCards(n, cls) {
  var out = "";
  for (var i = 0; i < n; i++) out += '<div class="' + cls + ' animate-pulse rounded border border-white/10 bg-white/[.03]"></div>';
  return out;
}
export function renderLoading() {
  $("#libGrid").innerHTML = skeletonCards(6, "h-[168px]");
  $("#evList").innerHTML  = skeletonCards(3, "h-[160px]");
  $("#panelBody").innerHTML = '<div class="h-24 animate-pulse rounded bg-white/[.05]"></div>';
}
export function renderError(retry) {
  var msg = '<div class="rounded border border-dashed border-white/20 p-8 text-center text-paper/60">' +
    esc(ui("errors.load")) +
    ' <button data-retry class="ml-2 text-gold underline">' + esc(ui("errors.retry")) + "</button></div>";
  $("#libGrid").innerHTML = msg;
  $("#evList").innerHTML  = msg;
  $("#panelBody").innerHTML = '<p class="m-0 text-[.88rem] text-paper/60">' + esc(ui("errors.load")) + "</p>";
  $$("[data-retry]").forEach(function (b) { b.addEventListener("click", retry); });
}

/* ------------------------------- panel ------------------------------- */
export function renderPanel() {
  var body = $("#panelBody"), cs = data.countries;
  $("#panelCount").textContent = data.loaded ? cs.length + " " + ui("panel.countries") : "";
  if (!data.loaded) return;

  var c = state.country ? findCountry(state.country) : null;
  if (!c) {
    body.innerHTML =
      '<p class="m-0 text-[.88rem] text-paper/60">' + esc(ui("panel.empty")) + "</p>" +
      '<div class="mt-3.5 flex flex-wrap gap-1.5"><button class="chip border-gold/45 text-gold" data-toggle>' +
        esc((state.showList ? ui("panel.hideList") : ui("panel.showList")).replace("{n}", cs.length)) +
      "</button></div>" +
      (state.showList ? '<div class="mt-2 flex flex-wrap gap-1.5">' + cs.map(function (x) {
        return '<button class="chip text-left" data-pick="' + esc(x.iso) + '">' +
          '<span class="mr-1.5 font-mono text-[.66rem] tracking-wider opacity-65">' + esc(x.iso2 || x.iso) + "</span>" +
          esc(x.name) + "</button>";
      }).join("") + "</div>" : "");
    var tg = $("[data-toggle]", body);
    if (tg) tg.addEventListener("click", function () { state.showList = !state.showList; renderPanel(); });
  } else {
    var next = data.events.filter(function (e) { return e.country === c.iso && !isPast(e); })
                          .sort(function (a, b) { return dt(a.start) - dt(b.start); }).slice(0, 3);
    var h = '<div class="fs-rise">' +
      '<div class="mb-2 font-mono text-2xl font-medium tracking-wider text-gold">' + esc(c.iso2 || c.iso) + "</div>" +
      '<h3 class="m-0 mb-1 font-display text-[1.35rem] font-extrabold leading-tight tracking-[-.025em]">' + esc(c.name) + "</h3>" +
      '<p class="mb-4 font-mono text-[.7rem] uppercase tracking-wider text-gold">' + esc(c.region) +
        (c.since ? " · " + esc(c.since) : "") + "</p>";
    if (c.note) h += '<p class="m-0 text-[.85rem] leading-relaxed text-paper/60">' + esc(c.note) + "</p>";
    if (next.length) {
      h += '<p class="mb-1.5 mt-4 text-[.85rem] text-gold">' + esc(ui("panel.next")) + "</p>" +
        next.map(function (e) {
          return '<a href="' + esc(eventHref(e.slug)) + '" data-event class="mt-2 block border-b border-white/10 pb-2 text-[.85rem] text-paper no-underline hover:text-gold">' +
            esc(e.title) + '<br><span class="text-[.78rem] text-paper/60">' + esc(fmtDate(e)) + "</span></a>";
        }).join("");
    }
    h += '<div class="mt-4 flex flex-wrap gap-2">' +
      (CONFIG.contactEmail ? '<a href="mailto:' + esc(CONFIG.contactEmail) + '" class="rounded-pill border border-gold/40 px-3 py-1.5 text-[.78rem] font-medium text-gold no-underline hover:bg-gold/10">' + esc(ui("panel.write")) + "</a>" : "") +
      '<button class="rounded-pill border border-gold/40 px-3 py-1.5 text-[.78rem] font-medium text-gold hover:bg-gold/10" data-pick="">' + esc(ui("panel.back")) + "</button>" +
    "</div></div>";
    body.innerHTML = h;
  }
  $$("[data-pick]", body).forEach(function (b) {
    b.addEventListener("click", function () { select(b.getAttribute("data-pick") || null); });
  });
}
export function select(iso, fromGlobe) {
  state.country = iso || null;
  renderPanel();
  if (globeRef) globeRef.select(state.country, !fromGlobe);
  $$("[data-iso]").forEach(function (l) {
    l.classList.toggle("bg-gold", l.dataset.iso === state.country);
    l.classList.toggle("text-ink", l.dataset.iso === state.country);
  });
}

/* ------------------------------ library ------------------------------ */
export function renderLibFilters() {
  var f = $("#libFilters"), seen = {}, items = [{ id: "all", label: ui("library.all") }];
  data.resources.forEach(function (r) {
    if (!r.topicId || seen[r.topicId]) return;
    seen[r.topicId] = 1; items.push({ id: r.topicId, label: r.topicLabel });
  });
  f.innerHTML = items.map(function (i) {
    return '<button class="pill" data-f="' + esc(i.id) + '" aria-pressed="' + (state.libFilter === i.id) + '">' + esc(i.label) + "</button>";
  }).join("");
  $$("button", f).forEach(function (b) {
    b.addEventListener("click", function () { state.libFilter = b.dataset.f; renderLibFilters(); renderLibrary(); });
  });
}
export function renderLibrary() {
  var g = $("#libGrid");
  var arr = data.resources.filter(function (r) { return state.libFilter === "all" || r.topicId === state.libFilter; });
  if (!arr.length) { g.innerHTML = '<p class="text-paper/60">' + esc(ui("library.empty")) + "</p>"; return; }
  g.innerHTML = arr.map(function (r) {
    var kindCls = r.kindStyle === "outline" ? "text-gold shadow-[inset_0_0_0_1px_rgba(249,199,15,.5)]"
                : r.kindStyle === "grey"    ? "bg-white/[.14] text-paper"
                : "bg-gold text-ink";
    var cover = r.cover
      ? '<img src="' + esc(asset(r.cover, "width=320&height=427&fit=cover&format=webp&quality=80")) + '" alt="" loading="lazy" class="absolute inset-0 h-full w-full object-cover">'
      : '<div class="absolute inset-0 bg-goldgrad opacity-20"></div>';
    return '<a href="' + esc(r.url) + '" target="_blank" rel="noopener" ' +
      'class="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-4 rounded border border-white/10 bg-white/[.02] p-4 no-underline transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/5">' +
      '<div class="relative overflow-hidden rounded aspect-[3/4]">' + cover + "</div>" +
      '<div class="flex min-w-0 flex-col gap-2">' +
        '<div class="flex items-center justify-between gap-2.5">' +
          '<span class="rounded px-2 py-0.5 font-mono text-[.63rem] font-medium tracking-widest ' + kindCls + '">' + esc(r.kindLabel) + "</span>" +
          (r.year ? '<span class="font-mono text-[.72rem] tracking-wide text-paper/60">' + esc(r.year) + "</span>" : "") +
        "</div>" +
        '<h3 class="m-0 font-display text-[1.08rem] font-bold leading-snug tracking-[-.02em]">' + esc(r.title) + "</h3>" +
        (r.author ? '<p class="m-0 text-[.85rem] text-gold">' + esc(r.author) + "</p>" : "") +
        '<p class="m-0 text-[.9rem] leading-relaxed text-paper/60">' + esc(r.why) + "</p>" +
      "</div></a>";
  }).join("");
}

/* ------------------------------- events ------------------------------ */
export function renderEvFilters() {
  var f = $("#evFilters"), seen = {}, items = [{ id: "upcoming", label: ui("events.all") }];
  data.events.forEach(function (e) {
    var tag = e.tags[0]; if (!tag || seen[tag.id]) return;
    seen[tag.id] = 1; items.push({ id: tag.id, label: tag.label });
  });
  items.push({ id: "past", label: ui("events.past") });
  f.innerHTML = items.map(function (i) {
    return '<button class="pill" data-f="' + esc(i.id) + '" aria-pressed="' + (state.evFilter === i.id) + '">' + esc(i.label) + "</button>";
  }).join("");
  $$("button", f).forEach(function (b) {
    b.addEventListener("click", function () { state.evFilter = b.dataset.f; renderEvFilters(); renderEvents(); });
  });
}
export function eventImage(e, cls) {
  var code = e.country || "SFL";
  if (e.image) return '<div class="relative overflow-hidden ' + cls + '"><img src="' +
    esc(asset(e.image, "width=900&height=560&fit=cover&format=webp&quality=80")) +
    '" alt="" loading="lazy" class="absolute inset-0 h-full w-full object-cover"></div>';
  return '<div class="relative overflow-hidden bg-goldgrad ' + cls + '">' +
    '<div class="absolute inset-0 flex items-center justify-center font-display text-[2.1rem] font-black tracking-tighter text-ink/30">' + esc(code) + "</div></div>";
}
export function renderEvents() {
  var list = $("#evList");
  var arr = data.events.filter(function (e) { return state.evFilter === "past" ? isPast(e) : !isPast(e); });
  if (state.evFilter !== "past" && state.evFilter !== "upcoming") {
    arr = arr.filter(function (e) { return e.tags.some(function (t) { return t.id === state.evFilter; }); });
  }
  arr.sort(function (a, b) { return state.evFilter === "past" ? dt(b.start) - dt(a.start) : dt(a.start) - dt(b.start); });
  if (!arr.length) {
    list.innerHTML = '<div class="rounded border border-dashed border-white/10 p-10 text-center text-paper/60">' + esc(ui("events.empty")) + "</div>";
    return;
  }
  list.innerHTML = arr.map(function (e) {
    var c = findCountry(e.country);
    return '<a href="' + esc(eventHref(e.slug)) + '" data-event class="relative grid grid-cols-1 overflow-hidden rounded border border-white/10 bg-white/[.02] no-underline transition hover:translate-x-1 hover:border-gold/55 hover:bg-gold/5 lg:grid-cols-[72px_230px_1fr_auto] ' + (isPast(e) ? "opacity-60" : "") + '">' +
      '<div class="absolute left-3 top-3 z-10 flex flex-row items-center gap-2 rounded-pill border border-white/10 bg-ink-deep/85 px-3 py-1 text-center backdrop-blur lg:static lg:flex-col lg:gap-1 lg:rounded-none lg:border-0 lg:border-r lg:border-white/10 lg:bg-white/[.03] lg:px-1.5 lg:py-4">' +
        '<span class="font-mono text-[1.05rem] font-medium leading-none tracking-wide text-gold">' + esc(c ? (c.iso2 || c.iso) : (e.country || "FS")) + "</span>" +
        '<span class="font-mono text-[.66rem] font-medium tracking-widest text-paper/60">' + esc(e.country || "") + "</span>" +
      "</div>" +
      eventImage(e, "min-h-[158px]") +
      '<div class="flex min-w-0 flex-col justify-center gap-2 px-6 py-5">' +
        '<span class="font-mono text-[.74rem] tracking-wide text-gold">' + esc(fmtDate(e)) + "</span>" +
        '<h3 class="m-0 font-display text-[1.2rem] font-bold leading-snug tracking-[-.022em]">' + esc(e.title) + "</h3>" +
        '<p class="m-0 line-clamp-2 text-[.92rem] text-paper/60">' + esc(e.desc) + "</p>" +
        '<div class="flex flex-wrap gap-3.5 text-[.83rem] text-paper/60"><span>' +
          esc(e.online ? ui("events.online") : e.place) + "</span>" +
          (e.language ? "<span>" + esc(e.language) + "</span>" : "") + "</div>" +
        '<div class="flex flex-wrap gap-1.5">' + e.tags.map(function (t, i) {
          return '<span class="tag ' + (i === 0 ? "tag-hot" : "") + '">' + esc(t.label) + "</span>";
        }).join("") + "</div>" +
      "</div>" +
      '<div class="hidden items-center whitespace-nowrap border-l border-white/10 px-7 font-mono text-[.74rem] font-medium tracking-wider text-gold lg:flex">' + esc(ui("events.open")) + "</div>" +
    "</a>";
  }).join("");
}

/* Called after any render that inserts an <img>. */
export function wireImages() { wireImageFallbacks(document); }
