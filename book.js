var pkg = require('./package.json')

module.exports = {
  root: "./docs",
  title: "Botpress Official Documentation",
  plugins: ["noembed", "sitemap", "expandable-chapters", "hints"],
  variables: {
    version: pkg.version,
    assets: 'https://raw.githubusercontent.com/botpress/botpress/next/assets'
  },
  },
  pluginsConfig: {
    sitemap: {
      hostname: "https://docs.botpress.io/"
    }
  }
}
