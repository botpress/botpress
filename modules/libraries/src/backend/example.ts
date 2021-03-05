const example = `const axios = require('axios')

module.exports = {
  hello: () => console.log('Hello there!'),
  printLog: message => console.log('Custom message:, message'),
  getPage: url => axios.get(url)
}

// Usage in your hooks/actions:
// const file = require('example')
// file.hello()`
export default example
