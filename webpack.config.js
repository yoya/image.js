module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'app.js',
    path: `${__dirname}/public`,
    publicPath: '/public/index.html'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  devtool: 'source-map'
};
