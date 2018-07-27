import bodyParser from 'body-parser'
import EventEmitter from 'eventemitter2'
import fetch from 'node-fetch'

class GoogleAssitant extends EventEmitter {
  constructor(bp, config) {
    super()
    if (!bp) {
      throw new Error('You need to specify botpress and config')
    }

    this.app = bp.getRouter('botpress-google-assistant', {
      'bodyParser.json': false
      // auth: req => !/\/webhook/i.test(req.originalUrl)
    })

    this.app.use(bodyParser.json())

    this._initWebhook()
  }

  _initWebhook() {
    this.app.post('/webhook', (req, res) => {
      this._handleEvent('message', req.body)
    })
  }

  _handleEvent(type, event) {
    this.emit(type, event)
  }
}

module.exports = GoogleAssitant
