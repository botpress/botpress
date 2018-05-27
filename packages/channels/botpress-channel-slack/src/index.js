import checkVersion from 'botpress-version-manager'

import outgoing from './outgoing'
import actions from './actions'

import _ from 'lodash'
import Promise from 'bluebird'

import UMM from './umm'
import Slack from './slack'

let slack = null

const outgoingMiddleware = (event, next) => {
  if (event.platform !== 'slack') {
    return next()
  }

  if (!outgoing[event.type]) {
    return next('Unsupported event type: ' + event.type)
  }

  outgoing[event.type](event, next, slack)
}

module.exports = {
  config: {
    apiToken: { type: 'string', default: '', env: 'SLACK_API_TOKEN' },
    botToken: { type: 'string', default: '', env: 'SLACK_BOT_TOKEN' },
    clientID: { type: 'string', default: '', env: 'SLACK_CLIENT_ID' },
    clientSecret: { type: 'string', default: '', env: 'SLACK_CLIENT_SECRET' },
    hostname: { type: 'string', default: '', env: 'SLACK_HOST' },
    verificationToken: { type: 'string', default: '', env: 'SLACK_VERIFICATION_TOKEN' },
    scope: {
      type: 'string',
      default: 'admin,bot,chat:write:bot,commands,identify,incoming-webhook,channels:read',
      env: 'SLACK_SCOPE'
    }
  },

  init(bp) {
    checkVersion(bp, bp.botpressPath)

    bp.middlewares.register({
      name: 'slack.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-slack',
      description:
        'Sends out messages that targets platform = slack.' +
        ' This middleware should be placed at the end as it swallows events once sent.'
    })

    bp.slack = {}
    _.forIn(actions, (action, name) => {
      bp.slack[name] = actions[name]
      const sendName = name.replace(/^create/, 'send')
      bp.slack[sendName] = Promise.method(function() {
        const msg = action.apply(this, arguments)
        return bp.middlewares.sendOutgoing(msg)
      })
    })

    // Set up endpoints as internal functions
    bp.slack['getUserProfile'] = function(id) {
      return slack.getUserProfile(id)
    }

    bp.slack['getUsers'] = function() {
      return slack.getUsers()
    }

    bp.slack['getChannels'] = function() {
      return slack.getChannels()
    }

    bp.slack['getDirectChannels'] = function() {
      return slack.getDirectChannels()
    }

    bp.slack['getTeam'] = function() {
      return slack.getTeam()
    }

    bp.slack['getData'] = function() {
      return slack.getData()
    }

    UMM(bp) // Initializes Slack in the UMM
  },

  ready: async function(bp, configurator) {
    const config = await configurator.loadAll()

    slack = new Slack(bp, config)

    const router = bp.getRouter('botpress-slack', { auth: req => !/\/action-endpoint/i.test(req.originalUrl) })

    const getStatus = () => ({
      connected: slack.isConnected()
    })

    const setConfigAndRestart = async newConfigs => {
      await configurator.saveAll(newConfigs)
      slack.setConfig(newConfigs)
      slack.connect(bp)
    }

    slack.connect(bp)

    router.get('/config', async (req, res) => {
      res.json(await configurator.loadAll())
    })

    router.post('/config', async (req, res) => {
      setConfigAndRestart(req.body)
      res.json(await configurator.loadAll())
    })

    router.get('/status', (req, res) => {
      res.json(getStatus())
    })

    router.get('/user', (req, res) => {
      slack.getUserProfile(req.query.id).then(user => {
        res.json(user)
      })
    })

    router.get('/users', (req, res) => {
      slack.getUsers().then(users => {
        res.json(users)
      })
    })

    router.get('/channels', (req, res) => {
      slack.getChannels().then(channels => {
        res.json(channels)
      })
    })

    router.get('/team', (req, res) => {
      res.json(slack.getTeam())
    })

    router.get('/data', (req, res) => {
      res.json(slack.getData())
    })
  }
}
