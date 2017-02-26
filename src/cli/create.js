import { spawn } from 'child_process'
import prompt from 'prompt'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import util from '../util'
import stats from '../stats'

const MODULE_NAME_CONVENTION_BEGINS = 'botpress-'
const MODULE_NAME_REGEX = new RegExp(/^botpress-.*/g)

const introductionText = "This program will bootstrap a new Botpress module"
const doneText = "You're all set! The module is boostrapped and ready to be developed."
const documentation = "Tip: when coding your bot, use the command `npm run watch` to recompile" +
  " your module automatically. Also, we strongly recommend that you install your module using " +
  "`npm link ../path/to/botpress-module` so that your bot always points to the most recent version."

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

const prefixModuleNameWithBotpress = name => {

  if (!MODULE_NAME_REGEX.test(name)) {
    util.print('warn','the name of your module needs to begin by "botpress-"')
    util.print('warn','we renamed your module to '+ chalk.bold(MODULE_NAME_CONVENTION_BEGINS + name))
    name = MODULE_NAME_CONVENTION_BEGINS + name
  }

  return name
}


module.exports = function() {
  const moduleDirectory = path.resolve('.')
  const dirname = path.basename(moduleDirectory)

  stats({}).track('cli', 'modules', 'create')

  util.print(introductionText)

  var schema = {
    properties: {
      name: {
        description: chalk.white('module name:'),
        pattern: /^[a-z0-9][a-z0-9-_\.]+$/,
        message: 'name must be only lowercase letters, ' +
          'digits, dashes, underscores and dots.',
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
    result.name = prefixModuleNameWithBotpress(result.name)
    
    
    if (dirname !== result.name) {
      util.print('warn', `We usually recommend that the name of the module directory (${dirname}) be the same as the module name (${result.name})`)
    }

    if (fs.existsSync(path.join(moduleDirectory, 'package.json'))) {
      util.print('error', "Expected module directory to be empty / uninitialized")
      process.exit(1)
    } else {
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

      util.print('Installing dependencies, please wait...')

      const install = spawn(util.npmCmd, ['install'])

      install.stdout.on('data', (data) => {
        process.stdout.write(data.toString())
      })

      install.stderr.on('data', (data) => {
        process.stdout.write(data.toString())
      })

      install.on('close', (code) => {
        if (code > 0) {
          util.print('error', 'An error occured during the dependencies installation of your module')
        } else {
          util.print('success', 'Module dependencies installed')
          util.print(doneText)
          util.print(documentation)
        }
      })
    }
  })
}
