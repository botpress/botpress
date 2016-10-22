import prompt from 'prompt'
import chalk from 'chalk'

module.exports = function(value, options) {

  var getKeywords = function(value, cb){

    if(typeof(value) === 'string'){
      cb(null, value)

    } else {
      var schema = {
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
      prompt.start();

      prompt.get(schema, function (err, result) {
          cb(err, result.keyword)
      })
    }
  }

  getKeywords(value, function(err, data){
     if (err) return console.error(err);
     console.log("You are actualy looking for: "+ data);
  })

}
