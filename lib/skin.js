const path = require('path');

const WebServer = require('./server');
const util = require('./util');

class skin {
  constructor({ botfile }) {
    this.projectLocation = path.dirname(botfile);
    this.botfile = require(botfile);
  }

  start() {
    // change the current working directory to skin's installation path
    // the bot's location is kept in this.projectLocation
    process.chdir(path.join(__dirname, '..'));

    const server = new WebServer({ skin: this });
    server.start();
    // TODO Boot server
  }
}

module.exports = skin;
