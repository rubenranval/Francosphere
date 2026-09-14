/* Francosphère — Directus data layer */

import { CONFIG } from "./config.js";
import { state } from "./core.js";

export const data = { countries: [], resources: [], events: [], loaded: false, error: null };
export const world = {};                 // iso3 -> outline, from data/world-110m.json

const raw = { countries: [], resources: [], events: [], langMap: {} };

/* Country outlines are reference geography, not content: one static file, loaded once. */
export function loadWorld() {
  return fetch("data/world-110m.json", { headers: { Accept: "application/json" } })
    .then(r => r.json())
    .then(list => { list.forEach(f => { world[f.id] = f; }); })
    .catch(() => {});
}

/* ------------------------------ Directus ----------------------------- */
export function apiBase() { return String(CONFIG.api || "").replace(/\/+$/, ""); }

export function apiGet(path) {
  return fetch(apiBase() + path, { headers: { Accept: "application/json" } }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    return r.json();
  }).then(function (j) { return j.data; });
}
/* Accepts either a Directus file (uploaded, and resized on the fly) or a plain URL
   to an image hosted elsewhere, which is passed through untouched. */
export function asset(file, params) {
  if (!file) return "";
  var id = typeof file === "object" ? (file.id || file.filename_disk || "") : String(file).trim();
  if (!id) return "";
  if (/^(https?:)?\/\//i.test(id) || id.charAt(0) === "/") return id;
  return apiBase() + "/assets/" + id + (params ? "?" + params : "");
}
/* Directus translations arrive as a list; pick the current language, then French,
   then whatever exists, so a half-translated item still renders. Matching is on the
   first two letters, so the language codes can be `fr`/`en` or `fr-FR`/`en-BE`. */
function translate(item) {
  var list = (item && item.translations) || [];
  function code(t) {
    if (!t) return "";
    var keys = ["languages_code", "languages_id", "language_code", "languages", "language"], v, i;
    for (i = 0; i < keys.length; i++) {
      if (t[keys[i]] != null) { v = t[keys[i]]; break; }
    }
    if (v == null) {                       // any key starting with "lang", whatever it's called
      for (var k in t) if (/^lang/i.test(k) && t[k] != null) { v = t[k]; break; }
    }
    if (v == null) return "";
    var out = String(typeof v === "object" ? (v.code || v.id || "") : v);
    return raw.langMap[out] || out;
  }
  function pick(two) {
    for (var i = 0; i < list.length; i++) {
      var c = code(list[i]);
      if (c && String(c).slice(0, 2).toLowerCase() === two) return list[i];
    }
    return null;
  }
  return pick(state.lang) || pick("fr") || list[0] || {};
}

/* `translations.*` rather than naming the join column: Directus calls it
   `languages_code` when the languages collection is keyed on `code`, but
   `languages_id` under other set-ups, and naming the wrong one 403s the request. */
var FIELDS = {
  countries: "id,iso3,iso2,since,lat,lng,translations.*",
  resources: "id,year,url,cover,kind.slug,kind.style,kind.translations.*,topic.id,topic.translations.*,translations.*",
  events:    "id,slug,start,end,tz_label,is_online,register_url,image,country.iso3," +
             "tags.fs_event_tags_id.id,tags.fs_event_tags_id.translations.*,translations.*"
};

export function load() {
  var q = "filter[status][_eq]=published&limit=-1";
  return Promise.all([
    apiGet("/items/fs_countries?" + q + "&sort=sort,iso3&fields=" + FIELDS.countries),
    apiGet("/items/fs_resources?" + q + "&sort=sort,id&fields=" + FIELDS.resources),
    apiGet("/items/fs_events?"    + q + "&sort=-start&fields="   + FIELDS.events),
    apiGet("/items/languages?limit=-1").catch(function () { return []; })
  ]).then(function (res) {
    raw.countries = res[0] || [];
    raw.resources = res[1] || [];
    raw.events    = res[2] || [];
    raw.langMap   = langMap(res[3] || []);
    applyLang();
    data.loaded = true;
  });
}
/* A translation row points at the languages collection by its primary key. When that
   key is `code` the value is already "fr"; when it is an auto-increment `id` the value
   is 1, which says nothing. So map every value in a language row onto whichever of its
   fields looks like a language code, and resolve through that. */
export function langMap(rows) {
  var map = {};
  (rows || []).forEach(function (row) {
    var code = null, k;
    for (k in row) {
      var v = row[k];
      if (typeof v === "string" && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(v)) { code = v; break; }
    }
    if (!code) return;
    for (k in row) {
      var val = row[k];
      if (val != null && typeof val !== "object") map[String(val)] = code;
    }
  });
  return map;
}
/* Translations are resolved here, so switching language only re-maps the
   payload already in memory — no second round trip. */
export function applyLang() {
  data.countries = raw.countries.map(normCountry).filter(function (c) { return c.iso; });
  data.resources = raw.resources.map(normResource);
  data.events    = raw.events.map(normEvent).filter(function (e) { return e.slug; });
}

export function normCountry(c) {
  var t = translate(c);
  return {
    iso: c.iso3, iso2: c.iso2, since: c.since,
    latlng: (c.lat != null && c.lng != null) ? [Number(c.lat), Number(c.lng)] : null,
    name: t.name || c.iso3, region: t.region || "", note: t.note || ""
  };
}
export function normResource(r) {
  var t = translate(r), k = r.kind || {}, top = r.topic || {};
  return {
    year: r.year, url: r.url || "#", cover: r.cover,
    kindLabel: (translate(k).label || k.slug || "").toUpperCase(),
    kindStyle: k.style || "gold",
    topicId: top.id != null ? String(top.id) : "",
    topicLabel: translate(top).label || "",
    title: t.title || "", author: t.author || "", why: t.why || ""
  };
}
export function normEvent(e) {
  var t = translate(e);
  var tags = (e.tags || []).map(function (x) {
    var tag = (x && x.fs_event_tags_id) ? x.fs_event_tags_id : x;
    if (!tag) return null;
    return { id: String(tag.id), label: translate(tag).label || "" };
  }).filter(function (x) { return x && x.label; });
  return {
    slug: e.slug, start: e.start, end: e.end, tz: e.tz_label,
    online: !!e.is_online, register: e.register_url || "", image: e.image,
    country: (e.country && e.country.iso3) || "", tags: tags,
    title: t.title || "", desc: t.summary || "", body: t.body || "",
    place: t.place || "", address: t.address || "",
    language: t.language_label || "", speakers: t.speakers || ""
  };
}

export function findCountry(iso) {
  for (var i = 0; i < data.countries.length; i++) if (data.countries[i].iso === iso) return data.countries[i];
  return null;
}
