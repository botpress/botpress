// @ts-check

const TJS = require('typescript-json-schema')
const os = require('os')
const fs = require('fs')
const glob = require('glob')

module.exports = () => {
  const settings = {
    required: true,
    ignoreErrors: true
  }

  const files = glob.sync('./src/bp/core/config/*.ts')
  const program = TJS.getProgramFromFiles(files)

  const writeSchema = (typeName, jsonFile) => {
    const definition = TJS.generateSchema(program, typeName, settings)
    const json = JSON.stringify(definition, null, 2) + os.EOL + os.EOL

    fs.writeFileSync(jsonFile, json)
  }

  writeSchema('BotpressConfig', './out/botpress.config.schema.json')
  writeSchema('BotConfig', './out/bot.config.schema.json')
}
