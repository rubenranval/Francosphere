/* Francosphère — date formatting */

import { state } from "./core.js";

/* -------------------------------- dates ------------------------------ */
export function dt(v) { return v ? new Date(v) : null; }
export function fmtDate(e, long) {
  var d = dt(e.start); if (!d || isNaN(d)) return "";
  var loc = state.lang === "fr" ? "fr-FR" : "en-GB";
  var s = d.toLocaleDateString(loc, long
    ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    : { day: "numeric", month: "short", year: "numeric" });
  s += " · " + d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  var e2 = dt(e.end);
  if (e2 && !isNaN(e2)) s += "–" + e2.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  if (e.tz) s += " " + e.tz;
  return s;
}
export function isPast(e) { var d = dt(e.end || e.start); return d && !isNaN(d) ? d.getTime() < Date.now() : false; }
