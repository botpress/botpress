import { spawn } from 'child_process'
import prompt from 'prompt'
import chalk from 'chalk'
import path from 'path'
import _ from 'lodash'
import fs from 'fs'

//   >> HELLO WORLD page (HTML view)

const introductionText = '' // TODO put text here
const nextStepText = 'now run ' + chalk.bold('`skin start`') + ' in your terminal'

const assertDoesntExist = (file) => {
  if(fs.existsSync(file)) {
    console.log('CRASH') // TODO put error text here
    process.exit(1)
  }
}

const getTemplate = (template) => {
  const templatePath = path.join(__dirname, 'templates', template)
  const templateContent = fs.readFileSync(templatePath)
  return _.template(templateContent)
}

const generateTemplate = (filename, variables = {}) => {
  const template = getTemplate(filename)
  const compiled = template(variables)
  fs.writeFileSync(filename, compiled)
}

module.exports = function() {

  console.log(introductionText)

  _.each(['package.json', 'botfile.js', 'index.js'], assertDoesntExist)

  const currentDirectoryName = path.basename(path.resolve('./'))

  var schema = {
    properties: {
      name: {
        description: chalk.white('name:'),
        pattern: /^[a-z0-9][a-z0-9-_\.]+$/,
        message: 'name must be only lowercase letters, ' +
          'digits, dashes, underscores and dots.',
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
        default: '1.0.0'
      },
    }
  }

  prompt.message = ''
  prompt.delimiter = ''

  prompt.start();

  prompt.get(schema, function (err, result) {

    generateTemplate('package.json', result)
    generateTemplate('LICENSE')
    generateTemplate('botfile.js')
    generateTemplate('index.js')

    fs.mkdirSync('ui')
    generateTemplate('ui/index.jsx')

    fs.mkdirSync('data')
    fs.writeFileSync('data/bot.log', '')
    fs.writeFileSync('data/notification.json', '[]')

    const install = spawn('npm', ['install'])

    install.stdout.on('data', (data) => {
      process.stdout.write(data.toString())
    })

    install.stderr.on('data', (data) => {
      process.stdout.write(data.toString())
    })

    install.on('close', (code) => {
      if(code > 0) {
        console.log(chalk.red('FAILED'))
      } else {
        console.log(chalk.green('SUCCESS'))
        console.log(nextStepText)
      }
    })
  })
}
