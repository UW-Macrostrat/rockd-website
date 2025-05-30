const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  performance: { hints: false },
  plugins: [
    new webpack.DefinePlugin({
      '__CLIENT__': true
    })
  ],
  entry: {
    client: './src/client.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-.env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.module\.css$/, // For CSS Modules
        use: ['style-loader', 'css-loader?modules']
      }      
    ]
 }
}
