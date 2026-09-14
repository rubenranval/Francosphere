/* Francosphère — meta tags and structured data */

import { state } from "./core.js";
import { ui } from "./i18n.js";
import { asset } from "./api.js";
import { CONFIG } from "./config.js";
import { baseAbs, absUrl, canonicalFor } from "./urls.js";

export function setTag(sel, attr, val) {
  var el = document.head.querySelector(sel);
  if (el && val) el.setAttribute(attr, val);
}
export function applySeo(e) {
  var site = ui("meta.title") || "Francosphère";
  var title = e ? (e.title + " · " + site) : (site + " — " + ui("meta.tagline"));
  var desc = (e ? e.desc : ui("meta.description")) || "";
  var img = (e && e.image)
    ? asset(e.image, "width=1200&height=630&fit=cover&format=jpeg&quality=82")
    : absUrl((CONFIG.seo || {}).ogImage || "assets/og.jpg");

  document.title = title;
  document.documentElement.lang = state.lang;
  setTag('meta[name="description"]', "content", desc);
  setTag('meta[property="og:title"]', "content", title);
  setTag('meta[name="twitter:title"]', "content", title);
  setTag('meta[property="og:description"]', "content", desc);
  setTag('meta[name="twitter:description"]', "content", desc);
  setTag('meta[property="og:image"]', "content", img);
  setTag('meta[name="twitter:image"]', "content", img);
  setTag('meta[property="og:type"]', "content", e ? "article" : "website");
  setTag('meta[property="og:url"]', "content", canonicalFor(e && e.slug, null));
  setTag('link[rel="canonical"]', "href", canonicalFor(e && e.slug, null));
  setTag('link[hreflang="fr"]', "href", canonicalFor(e && e.slug, "fr"));
  setTag('link[hreflang="en"]', "href", canonicalFor(e && e.slug, "en"));
  setTag('link[hreflang="x-default"]', "href", canonicalFor(e && e.slug, null));
  setTag('meta[property="og:locale"]', "content", state.lang === "fr" ? "fr_FR" : "en_US");
  setTag('meta[property="og:locale:alternate"]', "content", state.lang === "fr" ? "en_US" : "fr_FR");
  eventJsonLd(e);
}
export function eventJsonLd(e) {
  var old = document.getElementById("fs-event-ld");
  if (old) old.remove();
  if (!e || !e.start) return;
  var ld = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.desc,
    startDate: e.start,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: e.online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: state.lang,
    isAccessibleForFree: true,
    url: canonicalFor(e.slug, null),
    organizer: { "@type": "Organization", name: "Francosphère — Students For Liberty", url: baseAbs() }
  };
  if (e.end) ld.endDate = e.end;
  if (e.image) ld.image = [asset(e.image, "width=1200&height=630&fit=cover&format=jpeg&quality=82")];
  ld.location = e.online
    ? { "@type": "VirtualLocation", url: e.register || canonicalFor(e.slug, null) }
    : { "@type": "Place", name: e.place || "", address: e.address || e.place || "" };
  if (e.register) ld.offers = { "@type": "Offer", url: e.register, price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock" };
  if (e.speakers) ld.performer = e.speakers.split("\n").filter(Boolean).map(function (n) { return { "@type": "Person", name: n.trim() }; });
  var s = document.createElement("script");
  s.type = "application/ld+json"; s.id = "fs-event-ld";
  s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
}
