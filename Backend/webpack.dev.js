const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.js", // Assure-toi que ce chemin est correct
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".js", ".json"],
  },
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
  devtool: "inline-source-map", // Aide pour le debug en mode dev
};
