/* eslint-env node */

const Webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const path = require("path");

const webpackConfig = require("./webpack.config.js");

// overwrite entries/output (ugly but just werks and did not find any better)
webpackConfig.entry = path.join(__dirname, "../src/exports.ts");
webpackConfig.output.path = path.join(__dirname, "../demo/full");
webpackConfig.output.filename = "lib.js";

const compiler = Webpack(webpackConfig);
const server = new WebpackDevServer(compiler, {
  contentBase: path.join(__dirname, "../demo/full"),
  compress: true,
});

server.listen(8000, "127.0.0.1", function() {
  console.log("Starting server on http://localhost:8000");
});
