const express = require('express')
const app = express()
const path = require('path')

// Serve static files
app.use('/dist', express.static(path.resolve(__dirname, 'dist')))

// hide powered by express
app.disable('x-powered-by')

// Set the port
app.port = process.argv[2] || 3000

// Define a start function
app.start = () => {
  app.listen(app.port, () => {
    var date = new Date()
    console.log(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}  ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${date.getSeconds()}   server.js  26  Listening on port ${app.port}`)
  })
}

// Route requests
app.get('/trip/:trip_id?', require('./routes/trip'))

if (!module.parent) {
  app.start()
}

module.exports = app
