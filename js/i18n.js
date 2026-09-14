/* Francosphère — interface copy */

import { CONFIG } from "./config.js";
import { state } from "./core.js";

/* Reads a dotted path out of CONFIG.ui and resolves the {fr, en} pair. */
export function ui(path) {
  var o = CONFIG.ui || {}, parts = path.split(".");
  for (var i = 0; i < parts.length; i++) { if (o == null) return ""; o = o[parts[i]]; }
  if (o == null) return "";
  if (typeof o === "object") return o[state.lang] != null ? o[state.lang] : (o.fr || o.en || "");
  return String(o);
}

/* Same resolution for {fr, en} pairs held outside CONFIG.ui. */
export function pick(obj) {
  if (!obj) return "";
  return obj[state.lang] != null ? obj[state.lang] : (obj.fr || obj.en || "");
}
