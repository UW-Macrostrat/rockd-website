export default {
  clientRouting: false,
  supportsDarkMode: false,
  meta: {
    Page: {
      /* Sift must be rendered as a single-page app, because that is its design.
      It must only use server-side links to other pages, 
      because of its reliance on global styles that could leak to other pages with client routing
      */
      env: {
        client: true,
        server: false,
      },
    },
  },
  title: "Sift",
};