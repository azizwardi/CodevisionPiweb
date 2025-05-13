const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        main: './server.js'
    },

    output: {
        path: path.join(__dirname, 'dev_build'),
        publicPath: '/',
        filename: '[name].js',
        clean: true
    },

    mode: 'development',
    target: 'node',

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            },
            {
                test: /\.html$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext]'
                }
            }
        ]
    },

    resolve: {
        fallback: {
            "aws-sdk": false,
            "mock-aws-s3": false,
            "nock": false,
            "node-gyp": false,
            "npm": false,
            "bufferutil": false,
            "utf-8-validate": false,
            "kerberos": false,
            "@mongodb-js/zstd": false,
            "@aws-sdk/credential-providers": false,
            "gcp-metadata": false,
            "snappy": false,
            "socks": false,
            "aws4": false,
            "mongodb-client-encryption": false,
            "@huggingface/inference": false
        }
    },

    plugins: [
        new webpack.IgnorePlugin({
            resourceRegExp: /^(aws-sdk|mock-aws-s3|nock|node-gyp|npm|bufferutil|utf-8-validate|kerberos|@mongodb-js\/zstd|@aws-sdk\/credential-providers|gcp-metadata|snappy|socks|aws4|mongodb-client-encryption)$/
        })
    ]
}