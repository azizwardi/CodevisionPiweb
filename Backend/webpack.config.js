const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node", // Indique que Webpack build pour un environnement Node.js
  entry: "./server.js", // Change "index.js" par "server.js" si c'est le fichier principal
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".js", ".json"],
  },
  externals: [nodeExternals()], // Exclut `node_modules` du bundle
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
};
