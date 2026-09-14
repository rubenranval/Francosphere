/* Francosphère — routing */

import { state, $ } from "./core.js";
import { currentSlug } from "./urls.js";
import { applySeo } from "./seo.js";
import { renderDetail, closeDetail } from "./detail.js";

export function route() {
  const slug = currentSlug();
  if (slug) return renderDetail(slug);
  const was = document.body.classList.contains("detail");
  closeDetail();
  applySeo(null);
  if (was && location.hash) {
    const el = $(location.hash);
    if (el) setTimeout(() => el.scrollIntoView(), 0);
  }
}
