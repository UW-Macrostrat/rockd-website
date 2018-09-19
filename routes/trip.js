// Import our server-side renderer that has been compiled by babel
const ssr = require('./src-compiled/server')
// The page template (scaffold the HTML page)
const html = require('./src-compiled/html')


// our data model
let data = {
  trip_id: 1,
  name: 'A test trip'
}

let initialState = {
  main: {
    isFetching: false,
    trip: data
  }
}

module.exports = (req, res, next) => {
  if (req.params.trip_id) {
    data.trip_id = req.params.trip_id
  }
  const { preloadedState, content, css } = ssr(initialState)
  const response = html("Server Rendered Page", preloadedState, content, css)
  res.setHeader('Cache-Control', 'assets, max-age=604800')
  res.send(response)
}
