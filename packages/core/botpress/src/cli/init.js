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
Hey there 👋, thanks for using {bold Botpress}!
We'll walk you through the creation of your new bot.
For more information or help, please visit {underline https://botpress.io/docs}
{dim ---------------}`

const nextStepText = chalk`
{green 🎉  Your bot was initialized succesfully!}

{yellow Next steps:}
  {yellow 1)} Install bot dependencies by running {bold npm install} (or {bold yarn install})
  {yellow 2)} Start the bot by running {bold npm start} (or {bold yarn start})

{bold Enjoy Botpress!}
`

const invalidDirectoryError = chalk`
{red Fatal Error} You need to run this command in an empty directory.
`

const dirExistsError = dir => chalk`
{red Fatal Error} Directory {bold ${dir}} already exists.
`

const templateNotFoundError = template => chalk`
{red Fatal Error} Template {bold ${template}} not found.
`

const showTemplateInfo = info => chalk`
{dim =============================}
Template: {bold ${info.name}}
Author: {dim ${info.author}}
Description: {dim ${info.description}}
Channels: {yellow ${info.channels.join(', ')}}
{dim =============================}
`

const copyingFile = name => chalk`{dim -> Copying ${name}}`

const assertDoesntExist = file => {
  if (fs.existsSync(file)) {
    console.log(invalidDirectoryError)
    process.exit(1)
  }
}

// Show template description
// Say more templates coming up
// Ask questions
// Copy files, replacing variables
// Show "success, now run `yarn install`"

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
  const files = await loadTemplate('init-default')
  const hasNpmignore = files['.npmignore']

  const info = JSON.parse(files['info.json'])
  delete files['info.json']

  if (hasNpmignore) {
    // Npm renames .gitignore into .npmignore while publishing package which we need to revert
    // See https://github.com/npm/npm/wiki/Files-and-Ignores#details-1 for more details
    files['.gitignore'] = hasNpmignore
    delete files['.npmignore']
  }

  console.log(showTemplateInfo(info))

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

module.exports = async (dirName, { yes }) => {
  console.log(introductionText)

  // People can optionally provide the directory of the bot
  // Like "bp init my-bot"
  if (dirName) {
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName)
      process.chdir(dirName)
    } else {
      console.log(dirExistsError(dirName))
      return process.exit(1)
    }
  }

  // Loaded by Webpack at bundle time
  const botpressVersion = require('../../package.json').version

  stats({}).track('cli', 'bot', 'init')

  _.each(['package.json', 'botfile.js', 'index.js'], assertDoesntExist)

  // The name of the current directory
  const defaultBotName = path.basename(path.resolve('./'))

  const schema = {
    properties: {
      name: {
        description: chalk.white('name:'),
        pattern: /^[a-z0-9][a-z0-9-_\.]+$/,
        message: 'name must be only lowercase letters, ' + 'digits, dashes, underscores and dots.',
        required: true,
        default: defaultBotName
      },
      version: {
        required: true,
        description: chalk.white('botpress version:'),
        default: botpressVersion
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

  if (yes) {
    generate({
      name: defaultBotName,
      version: botpressVersion,
      description: '',
      author: ''
    })
  } else {
    prompt.message = ''
    prompt.delimiter = ''
    prompt.start()

    prompt.get(schema, (err, result) => {
      if (err) {
        if (err.message !== 'canceled') {
          console.error(err)
        }

        process.exit(1)
      }

      generate(result)
    })
  }
}
