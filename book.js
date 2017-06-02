var pkg = require('./package.json')

module.exports = {
  root: "./docs",
  title: "Botpress Official Documentation",
  plugins: ["noembed", "sitemap", "expandable-chapters", "alerts"],
  variables: {
    version: pkg.version
  },
  pluginsConfig: {
    sitemap: {
      hostname: "https://docs.botpress.io/"
    }
  }
}
