var fs = require('fs')
var path = require('path')

const repoRootDir = `${__dirname}/..`

async function main(args) {
  const configFilePath = `${repoRootDir}/out/bp/data/global/botpress.config.json`
  const rawConfig = fs.readFileSync(configFilePath, { encoding: 'utf8' })
  const config = JSON.parse(rawConfig)

  const toName = m => path.basename(m.location)
  config.modules = config.modules.map(m => ({ ...m, enabled: args.includes(toName(m)) }))

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), { encoding: 'utf8' })
}
main(process.argv.slice(2))
