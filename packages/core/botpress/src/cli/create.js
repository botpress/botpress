import { spawn } from 'child_process'
import prompt from 'prompt'
import chalk from 'chalk'
import path from 'path'
import mkdirp from 'mkdirp'
import _ from 'lodash'
import fs from 'fs'
import glob from 'glob'
import Promise from 'bluebird'

import stats from '../stats'

const introductionText = chalk`
{dim ---------------}
This tool will bootstrap a new {bold Botpress} module for you.
For more information or help, please visit {underline https://botpress.io/docs}
{dim ---------------}`

const nextStepText = chalk`
{green 🎉  Your module was successfully bootstraped!}

{yellow Next steps:}
  {yellow 1)} Install the dependencies by running {bold npm install} (or {bold yarn install})
  {yellow 2)} Compile the module using {bold npm run compile} (or {bold yarn run compile})
  {yellow 3)} Link the module to ease development and testing using {bold npm link}
  {yellow 4)} Install the module in your testing bot using {bold npm install --save path/to/the/module}
  {yellow 5)} Link the module using {bold npm link MODULE-NAME}

{bold Enjoy Botpress!}
`

const invalidDirectoryError = chalk`
{red Fatal Error} You need to run this command in an empty directory.
`

const templateNotFoundError = template => chalk`
{red Fatal Error} Template {bold ${template}} not found.
`

const copyingFile = name => chalk`{dim -> Copying ${name}}`

const assertDoesntExist = file => {
  if (fs.existsSync(file)) {
    console.log(invalidDirectoryError)
    process.exit(1)
  }
}

/**
 * Loads a template a returns a map of files and content
 * @param  {string} name The name of the template to load
 * @return {object} A map of files `{ path: content }``
 * @private
 */
const loadTemplate = async name => {
  const templatePath = path.join(__dirname, 'templates', name)

  if (!fs.existsSync) {
    console.log(templateNotFoundError(name))
    process.exit(1)
  }

  const files = await Promise.fromCallback(cb => glob('**/*.*', { cwd: templatePath, dot: true }, cb))

  return _.reduce(
    files,
    (obj, file) => {
      const filePath = path.join(templatePath, file)
      obj[file] = fs.readFileSync(filePath).toString()
      return obj
    },
    {}
  )
}

const generate = async result => {
  const files = await loadTemplate('create-default')

  for (const [name, content] of Object.entries(files)) {
    console.log(copyingFile(name))
    const compiled = _.template(content, { interpolate: /<%=([\s\S]+?)%>/g })
    const directory = path.dirname(name)
    if (directory.length) {
      mkdirp.sync(directory)
    }

    fs.writeFileSync(name, compiled(result))
  }

  console.log(nextStepText)
}

module.exports = () => {
  console.log(introductionText)

  const moduleDirectory = path.resolve('.')
  const dirname = path.basename(moduleDirectory)

  stats({}).track('cli', 'modules', 'create')

  _.each(['package.json', 'botfile.js', 'index.js'], assertDoesntExist)

  const schema = {
    properties: {
      name: {
        description: chalk.white('module name:'),
        pattern: /^(\@botpress\/|botpress-)[a-z0-9][a-z0-9-_\.]+$/,
        message: `Name must be only lowercase letters, digits, dashes, underscores and dots.
It must also start with "@botpress/" or "botpress-"`,
        required: true,
        default: dirname
      },
      description: {
        required: false,
        description: chalk.white('description:')
      },
      author: {
        required: false,
        description: chalk.white('author:')
      }
    }
  }

  prompt.message = ''
  prompt.delimiter = ''
  prompt.start()

  prompt.get(schema, (err, result) => {
    generate(result)
  })
}
