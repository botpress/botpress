var fs = require('fs')
var path = require('path')

const repoRootDir = `${__dirname}/..`

async function main(args) {
  // const paths = [
  //   `${repoRootDir}/`,
  //   `${repoRootDir}/out`,
  //   `${repoRootDir}/out/bp`,
  //   `${repoRootDir}/out/bp/data`,
  //   `${repoRootDir}/out/bp/data/global/` // does not exist...
  // ]
  // for (const p of paths) {
  //   try {
  //     console.log(fs.readdirSync(p))
  //   } catch (err) {
  //     console.error(`path ${p} doest no exist`)
  //   }
  // }

  const configSchemaSrcPath = `${repoRootDir}/out/bp/core/config/schemas/botpress.config.schema.json`
  const configSchemaDestPath = `${repoRootDir}/out/bp/data/botpress.config.schema.json`
  fs.copyFileSync(configSchemaSrcPath, configSchemaDestPath)

  const config = {
    $schema: `../botpress.config.schema.json`,
    ...defaultConfig,
    modules: await this.getModulesListConfig(),
    version: process.BOTPRESS_VERSION
  }

  await this.ghostService.global().upsertFile('/', 'botpress.config.json', stringify(config))

  const configFilePath = `${repoRootDir}/out/bp/data/global/botpress.config.json`
  const rawConfig = fs.readFileSync(configFilePath, { encoding: 'utf8' })
  const config = JSON.parse(rawConfig)

  const toName = m => path.basename(m.location)
  config.modules = config.modules.map(m => ({ ...m, enabled: args.includes(toName(m)) }))

  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), { encoding: 'utf8' })
}
main(process.argv.slice(2))
