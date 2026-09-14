/* Francosphère — shared state and DOM helpers */

export const state = {
  lang: "fr",
  country: null,
  evFilter: "upcoming",
  libFilter: "all",
  showList: false,
  hasLangParam: false
};

export const $  = (sel, root) => (root || document).querySelector(sel);
export const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/* Every value interpolated into markup goes through this. */
export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
