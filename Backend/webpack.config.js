<<<<<<< HEAD
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
=======
const path =require ('path');


module.exports={

    entry: {
        main:'./server.js'
    },

    output:{

        path : path.join(__dirname,'dev_build'),

        publicPath:'/',
        filename: '[name].js',
        clean:true
    },

    mode:'development',
    target:'node',

    module: {

        rules: [
            {
                test:/\.js$/,
                exclude:/node_modules/,
                loader:"babel-loader"
            }
        ]
    }

}
>>>>>>> c3feb64b86299234fb5d2fdcc672ed2263b95fbd
