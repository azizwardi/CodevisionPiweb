const path = require("path");

module.exports = {
  // Point d'entrée de l'application
  entry: "./src/index.js", // Si tu n'as pas de fichier `index.js`, remplace-le par ton fichier principal comme `server.js`

  // Où Webpack va placer le fichier compilé
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  // Résolution des extensions de fichier
  resolve: {
    extensions: [".js", ".json"], // Ajoute d'autres extensions si nécessaire
  },

  // Configuration pour les modules (par exemple, Babel pour la transpilation)
  module: {
    rules: [
      {
        test: /\.js$/, // Toutes les extensions .js
        exclude: /node_modules/,
        use: {
          loader: "babel-loader", // Utilise Babel pour transpiler ton code JS
        },
      },
    ],
  },
};
