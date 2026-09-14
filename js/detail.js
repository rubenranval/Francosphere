/* Francosphère — event page */

import { state, $, $$, esc } from "./core.js";
import { ui } from "./i18n.js";
import { data, findCountry } from "./api.js";
import { fmtDate, isPast, dt } from "./format.js";
import { applySeo } from "./seo.js";
import { eventImage } from "./views.js";

/* --------------------------- event detail ---------------------------- */
export function ics(e) {
  function z(d) { return new Date(d).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"; }
  var end = e.end || new Date(new Date(e.start).getTime() + 90 * 6e4);
  return "data:text/calendar;charset=utf-8," + encodeURIComponent([
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Francosphere//EN", "BEGIN:VEVENT",
    "UID:" + e.slug + "@francosphere", "DTSTAMP:" + z(new Date()), "DTSTART:" + z(e.start), "DTEND:" + z(end),
    "SUMMARY:" + e.title.replace(/[,;]/g, ""),
    "LOCATION:" + (e.online ? "Online" : e.place).replace(/[,;]/g, ""),
    "DESCRIPTION:" + e.desc.replace(/[,;\n]/g, " "), "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n"));
}
export function renderDetail(slug) {
  var d = $("#detail");
  document.body.classList.add("detail");
  $("#site").classList.add("hidden");
  d.classList.remove("hidden");
  window.scrollTo(0, 0);
  if (data.loaded) applySeo(data.events.filter(function (x) { return x.slug === slug; })[0] || null);

  if (!data.loaded) {
    d.innerHTML = '<div class="bg-stage pt-24"><div class="shell pb-16"><div class="h-40 animate-pulse rounded bg-white/[.05]"></div></div></div>';
    return;
  }
  var e = data.events.filter(function (x) { return x.slug === slug; })[0];
  var back = '<a href="' + esc(location.pathname + (state.hasLangParam ? "?lang=" + state.lang : "") + "#events") + '" data-back class="mb-6 inline-flex items-center gap-2 text-[.86rem] text-paper/60 no-underline hover:text-gold">← ' + esc(ui("detail.back")) + "</a>";
  if (!e) {
    d.innerHTML = '<div class="bg-stage pt-24"><div class="shell pb-16">' + back +
      '<h1 class="font-display text-5xl font-extrabold">404</h1><p class="text-paper/80">' + esc(ui("detail.missing")) + "</p></div></div>";
    bindBack(); return;
  }
  var c = findCountry(e.country);
  var where = e.online ? ui("events.online") : e.place;

  var side = "<dl class='m-0'>" +
    '<div class="row"><dt>' + esc(ui("detail.when")) + "</dt><dd>" + esc(fmtDate(e, true)) + "</dd></div>" +
    '<div class="row"><dt>' + esc(ui("detail.where")) + "</dt><dd>" + esc(where) +
      (e.address ? '<br><span class="font-normal opacity-60">' + esc(e.address) + "</span>" : "") + "</dd></div>" +
    (c ? '<div class="row"><dt>' + esc(ui("detail.host")) + "</dt><dd>" + esc(c.name) + "</dd></div>" : "") +
    (e.language ? '<div class="row"><dt>' + esc(ui("detail.lang")) + "</dt><dd>" + esc(e.language) + "</dd></div>" : "") +
    (e.speakers ? '<div class="row"><dt>' + esc(ui("detail.speakers")) + "</dt><dd>" +
      e.speakers.split("\n").map(esc).join("<br>") + "</dd></div>" : "") +
    "</dl>" +
    (e.register && !isPast(e) ? '<a href="' + esc(e.register) + '" target="_blank" rel="noopener" class="btn btn-gold mt-5 w-full justify-center no-underline">' + esc(ui("detail.register")) + "</a>" : "") +
    (dt(e.start) && !isNaN(dt(e.start)) ? '<a href="' + ics(e) + '" download="' + esc(e.slug) + '.ics" class="btn btn-ghost mt-3 w-full justify-center no-underline">' + esc(ui("detail.calendar")) + "</a>" : "");

  d.innerHTML =
    '<div class="bg-stage pt-24"><div class="shell">' + back +
      '<div class="grid items-end gap-11 pb-12 lg:grid-cols-[1.25fr_.75fr]"><div>' +
        '<div class="mb-4 flex flex-wrap gap-1.5">' + e.tags.map(function (t, i) {
          return '<span class="tag ' + (i === 0 ? "tag-hot" : "") + '">' + esc(t.label) + "</span>";
        }).join("") + "</div>" +
        '<h1 class="m-0 mb-4 font-display text-[clamp(1.9rem,4vw,3.1rem)] font-extrabold leading-none tracking-[-.035em]">' + esc(e.title) + "</h1>" +
        '<p class="mb-5 max-w-[52ch] text-[1.08rem] text-paper/80">' + esc(e.desc) + "</p>" +
        '<p class="m-0 font-mono text-[.9rem] tracking-wide text-gold">' + esc(fmtDate(e, true)) + " · " + esc(where) + "</p>" +
      "</div>" + eventImage(e, "rounded aspect-[16/10]") + "</div>" +
    "</div></div>" +
    '<div class="shell grid items-start gap-14 pb-24 pt-14 lg:grid-cols-[1fr_330px]">' +
      '<div class="prose-fs max-w-[68ch] text-[1.04rem]">' + (e.body || "<p>" + esc(e.desc) + "</p>") + "</div>" +
      '<aside class="rounded border border-white/10 bg-white/[.025] p-6 lg:sticky lg:top-[88px]">' + side + "</aside>" +
    "</div>";
  bindBack();
}
export function bindBack() {
  $$("[data-back]", $("#detail")).forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      history.pushState(null, "", a.getAttribute("href"));
      route();
    });
  });
}
export function closeDetail() {
  document.body.classList.remove("detail");
  $("#detail").classList.add("hidden");
  $("#site").classList.remove("hidden");
}
export function currentSlug() {
  var q = new URLSearchParams(location.search).get("event");
  if (q) return q;
  var m = /^#\/event\/(.+)$/.exec(location.hash);        // links shared before the switch
  return m ? decodeURIComponent(m[1]) : null;
}
export function route() {
  var slug = currentSlug();
  if (slug) return renderDetail(slug);
  var was = document.body.classList.contains("detail");
  closeDetail();
  applySeo(null);
  if (was && location.hash) {
    var el = $(location.hash);
    if (el) setTimeout(function () { el.scrollIntoView(); }, 0);
  }
}
