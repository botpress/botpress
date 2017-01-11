import prompt from 'prompt'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import util from '../util'
import stats from '../stats'

const MODULE_NAME_CONVENTION_BEGINS = 'botpress-'
const MODULE_NAME_REGEX = new RegExp(/^botpress-.*/g)

const introductionText = 'you are now creating a new module for your bot.'
const nextStepText = 'your module is now setup and ready to be develop.'

const getTemplate = (template) => {
  const templatePath = path.join(__dirname, 'templates/create' , template)
  const templateContent = fs.readFileSync(templatePath)
  return _.template(templateContent)
}

const generateTemplate = (directory, filename, variables = {}) => {
  const template = getTemplate(filename)
  const compiled = template(variables)
  const destination = path.join(directory, filename.replace(/_\._/, '.'))
  fs.writeFileSync(destination, compiled)
}

const prefixDirectoryNameWithBotpress = (directory) => {
  util.print('warn','the name of your module needs to begin by "botpress-"')
  util.print('warn','we renamed your module to '+ chalk.bold(MODULE_NAME_CONVENTION_BEGINS + directory))
  return MODULE_NAME_CONVENTION_BEGINS + directory
}


module.exports = function() {
  stats({}).track('cli', 'modules', 'create')

  util.print(introductionText)

  var schema = {
    properties: {
      name: {
        description: chalk.white('name:'),
        pattern: /^[a-z0-9][a-z0-9-_\.]+$/,
        message: 'name must be only lowercase letters, ' +
          'digits, dashes, underscores and dots.',
        required: true
      },
      description: {
        required: false,
        description: chalk.white('description:')
      },
      author: {
        required: false,
        description: chalk.white('author:')
      },
      version: {
        required: false,
        description: chalk.white('version:'),
        default: '1.0.0'
      }
    }
  }

  prompt.message = ''
  prompt.delimiter = ''

  prompt.start()

  prompt.get(schema, function (err, result) {
    var moduleDirectory = result.name

    if (!MODULE_NAME_REGEX.test(moduleDirectory)) {
      result.name = moduleDirectory = prefixDirectoryNameWithBotpress(moduleDirectory)
    }

    if (fs.existsSync(path.join(moduleDirectory, 'package.json'))) {
      util.print('error','directory name already exists in the current folder.')
      process.exit(1)
    } else {
      if (!fs.existsSync(moduleDirectory)) {
        fs.mkdirSync(moduleDirectory)
      }

      generateTemplate(moduleDirectory, 'package.json', result)
      generateTemplate(moduleDirectory, 'LICENSE')
      generateTemplate(moduleDirectory, 'webpack.js')
      generateTemplate(moduleDirectory, '_._gitignore')
      generateTemplate(moduleDirectory, '_._npmignore')

      fs.mkdirSync(moduleDirectory + '/src')
      generateTemplate(moduleDirectory, 'src/index.js')
      
      fs.mkdirSync(moduleDirectory + '/src/views')
      generateTemplate(moduleDirectory, 'src/views/index.jsx')
      generateTemplate(moduleDirectory, 'src/views/style.scss')

      util.print('success',nextStepText)
    }
  })
}
