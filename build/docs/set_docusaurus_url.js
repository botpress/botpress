var fs = require('fs')

const setBaseUrl = async () => {
  const file = './docs/guide/website/siteConfig.js'
  const args = process.argv.slice(2)

  const content = fs.readFileSync(file, 'utf-8')
  const replaced = content.replace(/baseUrl.*/, `baseUrl: '${args}',`)
  fs.writeFileSync(file, replaced, 'utf-8')
}
setBaseUrl()
