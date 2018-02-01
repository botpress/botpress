import { spawn } from 'child_process'
import prompt from 'prompt'
import chalk from 'chalk'
import path from 'path'
import _ from 'lodash'
import fs from 'fs'
import util from '../util'
import stats from '../stats'

const introductionText =
  '\nHey there, thanks for using botpress!' +
  "\nWe'll walk you through the creation of your new bot." +
  '\nFor more information or help, please visit http://github.com/botpress/botpress' +
  '\n---------------'

const nextStepText =
  '\nYour bot was initialized succesfully!' +
  `\nYou now need to install dependencies by running ${chalk.bold('`npm install`')}` +
  ` or ${chalk.bold('`yarn install`')}` +
  `\nYou'll then be able to run your bot by executing ${chalk.bold('`bp start`')} in your terminal`

const assertDoesntExist = file => {
  if (fs.existsSync(file)) {
    util.print(
      'error',
      'package.json or botfile.js are already in repository, ' + 'remove them before running this command again.'
    )
    process.exit(1)
  }
}

const getTemplate = template => {
  const templatePath = path.join(__dirname, 'cli/templates/init', template)
  const templateContent = fs.readFileSync(templatePath)
  return _.template(templateContent)
}

const generateTemplate = (filename, variables = {}) => {
  const template = getTemplate(filename)
  const compiled = template(variables)
  const destination = path.join(filename.replace(/_\._/, '.'))
  fs.writeFileSync(destination, compiled)
}

const generate = result => {
  generateTemplate('package.json', result)
  generateTemplate('LICENSE')
  generateTemplate('botfile.js')
  generateTemplate('index.js')
  generateTemplate('_._gitignore')
  generateTemplate('_._welcome')

  fs.mkdirSync('data')
  fs.mkdirSync('flows')
  fs.writeFileSync('data/bot.log', '')
  fs.writeFileSync('data/notification.json', '[]')

  fs.mkdirSync('modules_config')

  util.print(nextStepText)
}

module.exports = program => {
  const dirName = process.argv[3]
  if (dirName) {
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName)
      process.chdir(dirName)
    } else {
      util.print('error', dirName + ' directory already exists')
      return
    }
  }
  stats({}).track('cli', 'bot', 'init')

  util.print(introductionText)

  _.each(['package.json', 'botfile.js', 'index.js'], assertDoesntExist)

  const currentDirectoryName = path.basename(path.resolve('./'))

  const schema = {
    properties: {
      name: {
        description: chalk.white('name:'),
        pattern: /^[a-z0-9][a-z0-9-_\.]+$/,
        message: 'name must be only lowercase letters, ' + 'digits, dashes, underscores and dots.',
        required: true,
        default: currentDirectoryName
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
        default: '0.0.1'
      }
    }
  }

  if (program.yes) {
    generate({
      name: currentDirectoryName,
      description: '',
      author: '',
      version: '0.0.1'
    })
  } else {
    prompt.message = ''
    prompt.delimiter = ''
    prompt.start()

    prompt.get(schema, (err, result) => {
      // TODO: ignore err altogether?
      generate(result)
    })
  }
}
