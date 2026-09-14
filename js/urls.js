/* Francosphère — URL building */

import { CONFIG } from "./config.js";
import { state } from "./core.js";

export function baseAbs() {
  var s = (CONFIG.seo || {}).siteUrl;
  if (s) return s.replace(/\/+$/, "") + "/";
  return location.origin + location.pathname;
}
export function absUrl(p) { return /^https?:/.test(p) ? p : baseAbs().replace(/[^/]*$/, "") + String(p).replace(/^\.?\//, ""); }
export function canonicalFor(slug, lang) {
  var q = [];
  if (slug) q.push("event=" + encodeURIComponent(slug));
  if (lang) q.push("lang=" + lang);
  return baseAbs() + (q.length ? "?" + q.join("&") : "");
}
export function eventHref(slug) {
  var q = "?event=" + encodeURIComponent(slug);
  if (state.hasLangParam) q += "&lang=" + state.lang;
  return location.pathname + q;
}

/* The slug of the event currently being viewed, from ?event= or, for links shared
   before the switch, from the old #/event/ hash. */
export function currentSlug() {
  const q = new URLSearchParams(location.search).get("event");
  if (q) return q;
  const m = /^#\/event\/(.+)$/.exec(location.hash);
  return m ? decodeURIComponent(m[1]) : null;
}
