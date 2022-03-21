import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'

class ChannelsRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Channels', services)
    this.setupRoutes()
  }

  private setupRoutes() {
    // TODO: change mock implementation for database

    this.router.get(
      '/clients',
      this.asyncMiddleware(async (req, res) => {
        res.send(CLIENTS)
      })
    )

    this.router.get(
      '/clients/:clientId',
      this.asyncMiddleware(async (req, res) => {
        res.send(CONFIGS[req.params.clientId] || {})
      })
    )

    this.router.post(
      '/clients/:clientId',
      this.asyncMiddleware(async (req, res) => {
        CONFIGS[req.params.clientId] = req.body
        res.sendStatus(200)
      })
    )
  }
}

const CLIENTS = [
  {
    botId: 'brobro',
    clientId: '756a26ac-a96b-4e43-8c89-d764f398ef74'
  },
  {
    botId: 'gggg',
    clientId: 'd1c45555-be08-44bf-9338-c23d37d8e810'
  },
  {
    botId: 'bob',
    clientId: 'f16e357c-0f2c-492a-89ff-41bfc2ba82a6'
  },
  {
    botId: 'welcome-bot',
    clientId: '1dda57f7-7898-48ab-b698-98e8e7c373cf'
  },
  {
    botId: 'testbot',
    clientId: '075a70f9-c318-4d9c-8773-34f566f1c485'
  },
  {
    botId: 'yobot',
    clientId: '0b8ad4e3-95a6-4e34-bde5-b5761b001585'
  }
]

const CONFIGS = {
  '756a26ac-a96b-4e43-8c89-d764f398ef74': {
    telegram: {
      botToken: 'my-telegram-bot-token-2343efsefs'
    }
  }
}

export default ChannelsRouter
