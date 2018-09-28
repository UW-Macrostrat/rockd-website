function html(title, initialState = {}, content = "", css) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <meta http-equiv="Content-Language" content="en">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />

      <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
      <link rel="stylesheet" type="text/css" href="dist/css/styles.css"/>
      <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v0.49.0/mapbox-gl.css' rel='stylesheet' />
    </head>
    <body>
      <div class="wrapper container-fluid">
        <div id="react">
          ${content}
        </div>
      </div>

      <style id="jss-server-side">${css}</style>
      <script src="dist/js/vendors.js"></script>
      <script>
         window.__STATE__ = ${JSON.stringify(initialState)}
      </script>
      <script src="dist/client.js"></script>
    </body>
    </html>
  `
}

module.exports = html
