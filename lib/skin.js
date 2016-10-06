const WebServer = require('./server');
const util = require('./util');

class skin {
  constructor({ botfile }) {
    this.botfile = typeof(botfile) === 'object'
      ? botfile
      : require(botfile);
  }

  start() {
    const server = new WebServer({ skin: this });
    server.start();
    // TODO Boot server
  }
}

module.exports = skin;
