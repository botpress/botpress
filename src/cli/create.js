import { spawn } from 'child_process'
import prompt from 'prompt'
import chalk from 'chalk'
import path from 'path'
import _ from 'lodash'
import fs from 'fs'

const MODULE_NAME_CONVENTION_BEGINS = 'skin-'

const info = (message) => {
  return chalk.green('info: ') + message;
}

const warn = (message) => {
  return chalk.yellow('warn: ') + message;
}

const error = (message) => {
  return chalk.red('err: ') + message;
}

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
  fs.writeFileSync(path.join(directory, filename), compiled)
}

const isDirectoryExists = (directory) => {
   return (fs.existsSync(directory) || fs.existsSync(MODULE_NAME_CONVENTION_BEGINS + directory))
}

const addSkinToDirectory = (directory) => {
  console.log(warn('the name of your module needs to begin by skin-'))
  console.log(warn('we rename your module to '+ chalk.bold(MODULE_NAME_CONVENTION_BEGINS + directory)))
  return MODULE_NAME_CONVENTION_BEGINS + directory
}


module.exports = function() {

  console.log(info(introductionText))

  const currentDirectoryName = path.basename(path.resolve('./'))

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

  prompt.start();

  prompt.get(schema, function (err, result) {
    var moduleDirectory = result.name

    if(moduleDirectory.substring(5) !== MODULE_NAME_CONVENTION_BEGINS){
      moduleDirectory = addSkinToDirectory(moduleDirectory)
    }

    if(isDirectoryExists(moduleDirectory)) {
      console.log(error('directory name already exists in the current folder.'))
      process.exit(1)
    } else {
      fs.mkdirSync(moduleDirectory)

      generateTemplate(moduleDirectory, 'package.json', result)
      generateTemplate(moduleDirectory, 'LICENSE')
      generateTemplate(moduleDirectory, 'index.js')

      fs.mkdirSync(moduleDirectory+'/views')
      generateTemplate(moduleDirectory, '/views/index.jsx')
      generateTemplate(moduleDirectory, '/views/test.scss')

      console.log(info(nextStepText))
    }
  })
}
