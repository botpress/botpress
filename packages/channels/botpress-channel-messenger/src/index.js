/* global __dirname */

import checkVersion from 'botpress-version-manager'

import path from 'path'
import fs from 'fs'
import _ from 'lodash'

import uuid from 'uuid'
import Promise from 'bluebird'

import Messenger from './messenger'
import actions from './actions'
import outgoing from './outgoing'
import incoming from './incoming'
import Users from './users'
import UMM from './umm'

import configTemplate from 'raw-loader!./botpress-messenger.config.yml'

let messenger = null
const outgoingPending = outgoing.pending

let users = null

const outgoingMiddleware = (event, next) => {
  if (event.platform !== 'facebook') {
    return next()
  }

  if (!outgoing[event.type]) {
    return next('Unsupported event type: ' + event.type)
  }

  const setValue = method => (...args) => {
    if (event.__id && outgoingPending[event.__id]) {
      if (args && args[0] && args[0].message_id) {
        outgoingPending[event.__id].timestamp = new Date().getTime() - 1000
        outgoingPending[event.__id].mid = args[0].message_id
      }

      if (method === 'resolve' && (event.raw.waitDelivery || event.raw.waitRead)) {
        // We skip setting this value because we wait
      } else {
        outgoingPending[event.__id][method].apply(null, args)
        delete outgoingPending[event.__id]
      }
    }
  }

  outgoing[event.type](event, next, messenger).then(setValue('resolve'), setValue('reject'))
}

const initializeMessenger = (bp, configurator) => {
  return configurator.loadAll().then(config => {
    messenger = new Messenger(bp, config)

    users = Users(bp, messenger)

    const configErrors = messenger.getConfigErrors()
    const enabled = config.enabled

    if (!enabled) {
      return bp.logger.warn('[botpress-messenger] Connection disabled.')
    }

    if (configErrors.length) {
      for (var err of configErrors) {
        bp.logger.warn('[botpress-messenger] ' + err.message)
      }

      return bp.notifications.send({
        level: 'error',
        message: 'Error updating Messenger App. Please see logs for details.'
      })
    }

    return messenger
      .connect()
      .then(() => messenger.updateSettings())
      .then(() =>
        bp.notifications.send({
          level: 'success',
          message: 'Configuration and webhook updated'
        })
      )
      .catch(err => {
        bp.logger.error(err)
        return bp.notifications.send({
          level: 'error',
          message: 'Error updating Messenger App. Please see logs for details.'
        })
      })
  })
}

const createConfigFile = bp => {
  const name = 'botpress-messenger.config.yml'
  const file = path.join(bp.projectLocation, name)

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, configTemplate)

    bp.notifications.send({
      level: 'info',
      message: name + ' has been created, fill it'
    })
  }
}

module.exports = {
  config: {
    applicationID: { type: 'string', required: true, default: '', env: 'MESSENGER_APP_ID' },
    accessToken: { type: 'string', required: true, default: '', env: 'MESSENGER_ACCESS_TOKEN' },
    appSecret: { type: 'string', required: true, default: '', env: 'MESSENGER_APP_SECRET' },
    verifyToken: { type: 'string', required: false, default: uuid.v4() },
    enabled: { type: 'bool', required: true, default: true },
    validated: { type: 'bool', required: false, default: false }, // deprecated --> automaticcaly reconfigure on start (config = enabled)
    connected: { type: 'bool', required: false, default: false }, // deprecated --> automaticcaly reconfigure on start (config = enabled)
    hostname: { type: 'string', required: false, default: '', env: 'MESSENGER_HOST' },
    homepage: { type: 'string' },
    displayGetStarted: { type: 'bool', required: false, default: true },
    greetingMessage: { type: 'string', required: false, default: 'Default greeting message' },
    persistentMenu: { type: 'bool', required: false, default: false },
    persistentMenuItems: { type: 'any', required: false, default: [], validation: v => _.isArray(v) },
    composerInputDisabled: { type: 'bool', required: false, default: false },
    automaticallyMarkAsRead: { type: 'bool', required: false, default: true },
    targetAudience: { type: 'string', required: true, default: 'openToAll' },
    targetAudienceOpenToSome: { type: 'string', required: false },
    targetAudienceCloseToSome: { type: 'string', required: false },
    trustedDomains: { type: 'any', required: false, default: [], validation: v => _.isArray(v) },
    autoRespondGetStarted: { type: 'bool', required: false, default: true }, // deprecated
    autoResponse: { type: 'string', required: false, default: 'Hello!' }, // deprecated
    autoResponseOption: { type: 'string', required: false, default: 'autoResponseText' },
    autoResponseText: { type: 'string', required: false, default: 'Hello, human!' },
    autoResponsePostback: { type: 'string', required: false, default: 'YOUR_POSTBACK' },
    paymentTesters: { type: 'any', required: false, default: [], validation: v => _.isArray(v) },
    chatExtensionHomeUrl: { type: 'string', required: false, default: '' },
    chatExtensionInTest: { type: 'bool', required: false, default: true },
    chatExtensionShowShareButton: { type: 'bool', required: false, default: false },
    webhookSubscriptionFields: {
      type: 'any',
      required: true,
      default: [
        'message_deliveries',
        'message_reads',
        'messages',
        'messaging_optins',
        'messaging_postbacks',
        'messaging_referrals'
      ]
    }
  },

  init: function(bp) {
    checkVersion(bp, __dirname)

    bp.middlewares.register({
      name: 'messenger.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-messenger',
      description:
        'Sends out messages that targets platform = messenger.' +
        ' This middleware should be placed at the end as it swallows events once sent.'
    })

    bp.messenger = {}
    _.forIn(actions, (action, name) => {
      const applyFn = fn =>
        function() {
          var msg = action.apply(this, arguments)
          const promise = msg._promise
          return fn && fn(msg, promise)
        }

      const deprecate = fn =>
        function() {
          return (
            (bp.lts &&
              bp.lts.deprecate(
                {
                  module: 'botpress-messenger',
                  message:
                    'create___ and send___ methods have been deprecated in favor of UMM and will be officially removed in Botpress v2.0',
                  referenceUrl: 'https://botpress.io/docs/foundamentals/umm.html'
                },
                fn
              )) ||
            fn.apply(this, arguments)
          )
        }

      var sendName = name.replace(/^create/, 'send')
      bp.messenger[sendName] = deprecate(
        Promise.method(applyFn((msg, promise) => bp.middlewares.sendOutgoing(msg) && promise))
      )
      bp.messenger[name] = deprecate(applyFn(msg => msg))
    })

    createConfigFile(bp)
    UMM(bp) // Initializes Messenger in the UMM
  },

  ready: function(bp, config) {
    initializeMessenger(bp, config).then(() => {
      incoming(bp, messenger)

      bp.messenger._internal = messenger

      const router = bp.getRouter('botpress-messenger')

      router.get('/config', (req, res) => {
        res.send(messenger.getConfig())
      })

      router.post('/config', (req, res) => {
        messenger.setConfig(req.body)
        config
          .saveAll(messenger.getConfig())
          .then(() => messenger.updateSettings())
          .then(() => res.sendStatus(200))
          .catch(err => {
            res.status(500).send({ message: err.message })
          })
      })

      router.post('/connection', (req, res) => {
        if (messenger.getConfig().connected) {
          messenger
            .disconnect()
            .then(() => res.sendStatus(200))
            .catch(err => res.status(500).send({ message: err.message }))
        } else {
          messenger
            .connect()
            .then(() => res.sendStatus(200))
            .catch(err => res.status(500).send({ message: err.message }))
        }
      })

      router.post('/validation', (req, res) => {
        messenger
          .sendValidationRequest()
          .then(json => {
            res.send(json)
          })
          .catch(err => {
            res.status(500).send({ message: err.message })
          })
      })

      router.get('/homepage', (req, res) => {
        const packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')))
        res.send({ homepage: packageJSON.homepage })
      })

      router.get('/users', (req, res) => {
        users
          .getAllUsers()
          .then(values => {
            res.send(values)
          })
          .catch(err => res.status.send(500).send({ message: err.message }))
      })

      router.post('/remove_payment_tester', (req, res) => {
        messenger
          .deletePaymentTester(req.body.payment_tester)
          .then(json => {
            res.send(json)
          })
          .catch(err => {
            res.status(500).send({ message: err.message })
          })
      })

      router.get('/facebook_page', (req, res) => {
        messenger
          ._getPage()
          .then(json => {
            res.send(json)
          })
          .catch(err => {
            res.status(500).send({ message: err.message })
          })
      })
    })
  }
}
