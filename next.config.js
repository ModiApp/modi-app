const { withExpo } = require('@expo/next-adapter');
const withTM = require('next-transpile-modules')([
  '@expo/vector-icons',
]);

module.exports = withExpo(
  withTM({
    webpack(config, options) {
      config.module.rules.push({
        test: /\.(ttf|otf|eot|woff|woff2)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name].[hash][ext]',
        },
      });
      return config;
    },
  })
); 