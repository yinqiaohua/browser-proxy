var path = require('path');
module.exports = {
  entry:[
    'index.js'
  ],
  output: {
    path: __dirname + '/dist/',
    publicPath: "/dist/",
    filename: 'index.js'
  },
  resolve: {
    root: path.resolve('./src/'),
    extensions: ['', '.js', '.jsx']
  },
  resolveLoader: { root: path.join(__dirname, "node_modules") },
  module: {
    loaders: [
      { test: /\.jsx?$/, loaders: ['jsx?harmony']}
    ]
  }
};