# Rockd website


This is the code for Version 1 of Rockd's website.
It is a collection of flat HTML files, with some CSS, JS, and image assets.

As of mid-2023, we're working on an updated
Version 2 that uses Macrostrat's in-development [web component libraries](https://github.com/UW-Macrostrat/web-components)
and adheres to modern development approaches.

The [web-app](./web-app) directory contains an older version of Rockd's Ionic "Progressive Web App" (PWA) codebase.

There is a companion [trips viewer](https://github.com/UW-Macrostrat/rockd-trips) that shows maps for all trips.

To run a development server, simply start a file server, e.g.:

  ```bash
  python3 -m http.server
  ```

and navigate to `localhost:8000` in your browser.
