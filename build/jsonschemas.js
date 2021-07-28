// @ts-check

const TJS = require('typescript-json-schema')
const os = require('os')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const mkdirp = require('mkdirp')

module.exports = () => {
  const settings = {
    required: true,
    ignoreErrors: true
  }

  const files = glob.sync('./packages/bp/src/core/config/*.ts')
  const program = TJS.getProgramFromFiles(files)

  const writeSchema = (typeName, jsonFile) => {
    const definition = TJS.generateSchema(program, typeName, settings)
    const json = JSON.stringify(definition, null, 2) + os.EOL + os.EOL

    const fileToWrite = path.resolve('./packages/bp/dist/core/config/schemas', jsonFile)
    mkdirp.sync(path.dirname(fileToWrite))
    fs.writeFileSync(fileToWrite, json)
  }

  writeSchema('BotpressConfig', 'botpress.config.schema.json')
  writeSchema('BotConfig', 'bot.config.schema.json')
}
