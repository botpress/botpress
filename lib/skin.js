const util = require('./util');

class skin {
  constructor({ botfile }) {
    this.botfile = typeof(botfile) === 'object'
      ? botfile
      : require(botfile);
  }

  start() {
    
    // TODO Boot server
  }
}

module.exports = skin;
