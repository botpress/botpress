import prompt from 'prompt'
import chalk from 'chalk'
import Promise from 'bluebird'

module.exports = function(argument, options) {
  const getKeywords = Promise.method(argument => {
    if (typeof argument === 'string') {
      return argument
    } else {
      const schema = {
        properties: {
          keyword: {
            description: chalk.white('keyword:'),
            pattern: /^[a-zA-Z0-9][a-zA-Z0-9-_\.]+$/,
            message: 'keyword must be letters, digits, dashes, underscores and dots.',
            required: true
          }
        }
      }

      prompt.message = ''
      prompt.delimiter = ''
      prompt.start()

      return Promise.fromCallback(function(callback) {
        prompt.get(schema, callback)
      }).then(result => result.keyword)
    }
  })

  const printResult = keyword => {
    console.log('You are actualy looking for: ' + keyword)
  }

  getKeywords(argument).then(printResult)
}
