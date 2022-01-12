import fs from 'fs'
import glob from 'glob'
import mkdirp from 'mkdirp'
import os from 'os'
import path from 'path'
import { getProgramFromFiles, generateSchema } from 'typescript-json-schema'

const settings = {
  required: true,
  ignoreErrors: true
}

const files = glob.sync(path.resolve(__dirname, '../src/runtime/config/*.ts'))
const program = getProgramFromFiles(files)

const writeSchema = (typeName, jsonFile) => {
  const definition = generateSchema(program, typeName, settings)
  const json = JSON.stringify(definition, null, 2) + os.EOL + os.EOL

  const fileToWrite = path.resolve('./dist/runtime/config/schemas', jsonFile)
  mkdirp.sync(path.dirname(fileToWrite))
  fs.writeFileSync(fileToWrite, json)
}

writeSchema('RuntimeConfig', 'runtime.config.schema.json')
writeSchema('BotConfig', 'bot.config.schema.json')
