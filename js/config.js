/* ==========================================================================
   Francosphère — configuration
   --------------------------------------------------------------------------
   Le contenu (pays, bibliothèque, événements) vit dans Directus et se modifie
   sans toucher au code. Ne restent ici que l'adresse de l'API, les images
   livrées avec la page, et les libellés de l'interface.

   Content (countries, library, events) lives in Directus and is edited there.
   Only the API address, the page's own images and the interface labels remain.
   ========================================================================== */
export const CONFIG = {

  /* Directus base URL — no trailing slash */
  api: "https://content-library.studentsforliberty.fr",

  /* SEO. siteUrl must be the public address, with the trailing slash: it builds the
     canonical link, the hreflang pair and the Open Graph URLs. */
  seo: {
    siteUrl: "https://francosphere.studentsforliberty.org/",
    ogImage: "assets/og.jpg"          // 1200 × 630, used when a page has no image of its own
  },

  contactEmail: "francosphere@studentsforliberty.org",

  /* Globe orientation on load: [latitude, longitude] */
  globeCenter: [16, 14],

  brand: {
    logo: "assets/logo-francosphere.png",
    alt: "Students For Liberty — Francosphère"
  },

  /* Photos shipped alongside the page. A missing file shows a dashed frame
     with the expected path rather than a broken image. */
  images: {
    hero:   { src: "assets/hero.jpg" },
    banner: { src: "assets/banner2.jpg", alt: "" },
    gallery: [
      { src: "assets/1.jpg", alt: "", caption: { fr: "", en: "" } },
      { src: "assets/2.jpg", alt: "", caption: { fr: "", en: "" } },
      { src: "assets/3.jpg", alt: "", caption: { fr: "", en: "" } }
    ]
  },

  footerLinks: [
    { label: { fr: "Students For Liberty", en: "Students For Liberty" }, url: "https://studentsforliberty.org" },
    { label: { fr: "Nous écrire", en: "Email us" }, url: "mailto:francosphere@studentsforliberty.org" },
    { label: { fr: "Instagram", en: "Instagram" }, url: "https://www.instagram.com/sfl_francosphere" }
  ],

  ui: {
    meta: {
      title:   { fr: "Francosphère", en: "Francosphere" },
      tagline: { fr: "Les idées de la liberté, en français", en: "The ideas of liberty, in French" },
      description: {
        fr: "Une bibliothèque de textes libéraux en français, des rencontres en ligne et des clubs de lecture, ouverts aux francophones de quatre continents.",
        en: "A library of French-language liberal texts, live online sessions and reading clubs, open to French speakers across four continents."
      }
    },
    nav: {
      about:   { fr: "Le projet",   en: "The project" },
      library: { fr: "Ressources",  en: "Resources" },
      work:    { fr: "Activités",   en: "What we do" },
      events:  { fr: "Événements",  en: "Events" }
    },
    hero: {
      title: { fr: 'Les idées de la liberté, <em class="bg-goldgrad bg-clip-text not-italic text-transparent">en français</em>.',
               en: 'The ideas of liberty, <em class="bg-goldgrad bg-clip-text not-italic text-transparent">in French</em>.' },
      lede:  { fr: "Une bibliothèque, des rencontres en ligne et des clubs de lecture ouverts à tous les francophones curieux de comprendre ce qui rend une société libre.",
               en: "A library, live online sessions and reading clubs, open to any French speaker curious about what makes a society free." },
      cta1:  { fr: "Commencer à lire", en: "Start reading" },
      cta2:  { fr: "Prochaines rencontres", en: "What's coming up" }
    },
    panel: {
      title:     { fr: "Près de chez vous", en: "Near you" },
      countries: { fr: "pays", en: "countries" },
      empty:     { fr: "Cliquez sur un pays du globe pour voir ce qui s'y passe.",
                   en: "Click a country on the globe to see what happens there." },
      showList:  { fr: "Voir les {n} pays", en: "See all {n} countries" },
      hideList:  { fr: "Masquer la liste", en: "Hide the list" },
      next:      { fr: "Prochainement dans ce pays", en: "Coming up in this country" },
      write:     { fr: "Nous écrire", en: "Email us" },
      back:      { fr: "Tous les pays", en: "All countries" }
    },
    about: {
      title: { fr: "Le projet", en: "The project" },
      lede:  { fr: "Presque tout ce qui s'écrit d'intéressant sur la liberté s'écrit en anglais. On répare ça.",
               en: "Almost everything worth reading about liberty is written in English. We're fixing that." },
      p1:    { fr: "La Francosphère rassemble des étudiants et des lecteurs francophones répartis sur quatre continents autour d'une question commune : qu'est-ce qui permet à une société de rester libre, prospère et pacifique ?",
               en: "The Francosphere brings together French-speaking students and readers across four continents around one shared question: what allows a society to stay free, prosperous and at peace?" },
      p2:    { fr: "Concrètement, cela veut dire une bibliothèque de textes en français, des rencontres en ligne où l'on discute avec des intervenants du monde entier et des clubs de lecture qui mêlent volontairement les pays.",
               en: "In practice that means a library of French-language texts, live online sessions with speakers from around the world and reading clubs with people from different countries." }
    },
    library: {
      title: { fr: "La bibliothèque", en: "The library" },
      lede:  { fr: "Des textes fondateurs de la tradition libérale, en français.",
               en: "Foundational texts of the classical liberal tradition, in French." },
      all:   { fr: "Tout", en: "Everything" },
      empty: { fr: "Rien dans cette catégorie pour le moment.", en: "Nothing in this category yet." }
    },
    events: {
      title:  { fr: "Événements", en: "Events" },
      lede:   { fr: "Webinaires, clubs de lecture et rencontres, la plupart en ligne. Inscription libre.",
                en: "Webinars, reading clubs and meet-ups, mostly online. Free to join." },
      all:    { fr: "Tout ce qui vient", en: "Everything upcoming" },
      past:   { fr: "Déjà passés", en: "Already happened" },
      online: { fr: "En ligne", en: "Online" },
      open:   { fr: "Détails", en: "Details" },
      empty:  { fr: "Rien pour l'instant dans cette catégorie.", en: "Nothing here yet." }
    },
    detail: {
      back:     { fr: "Tous les événements", en: "All events" },
      when:     { fr: "Quand", en: "When" },
      where:    { fr: "Où", en: "Where" },
      host:     { fr: "Organisé par", en: "Hosted by" },
      lang:     { fr: "Langue", en: "Language" },
      speakers: { fr: "Intervenants", en: "Speakers" },
      register: { fr: "S'inscrire", en: "Register" },
      calendar: { fr: "Ajouter au calendrier", en: "Add to calendar" },
      missing:  { fr: "Cet événement n'existe pas ou a été retiré.", en: "This event doesn't exist or has been removed." }
    },
    errors: {
      load:  { fr: "Le contenu n'a pas pu être chargé.", en: "The content could not be loaded." },
      retry: { fr: "Réessayer", en: "Try again" }
    },
    footer: {
      blurb: { fr: "Les idées de la liberté, en français, sur quatre continents.",
               en: "The ideas of liberty, in French, across four continents." },
      note:  { fr: "Un projet du réseau Students For Liberty.", en: "A Students For Liberty network project." }
    }
  }
};
