module.exports = [
  {
    path: 'dist/index.js',
    limit: '4 KB',
    ignore: ['vue', 'vue-router', '@vue/devtools-api'],
    modifyEsbuildConfig(config) {
      config.format = 'esm';
      config.external = [...(config.external || []), './devtools-*'];
      return config;
    },
  },
];
