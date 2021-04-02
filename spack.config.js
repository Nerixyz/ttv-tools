const { config } = require("@swc/core/spack");

module.exports = config({
  entry: __dirname + '/src/context/context-script.ts',
  output: {
    path: __dirname + '/dist/build',
    name: 'context-script.js'
  },
  options: {
    swcrc: true,
    sourceMaps: 'inline'
  },
  module: {}
});
