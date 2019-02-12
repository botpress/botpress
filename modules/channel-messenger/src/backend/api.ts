import axios from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export default async (bp: typeof sdk) => {
  const channel = 'messenger'
  const messengerRouter = bp.http.createRouterForBot('channel-messenger', { checkAuthentication: false })
  const http = axios.create({ baseURL: 'https://graph.facebook.com/v2.6/me' })
  const moduleConfigCache: { [key: string]: Object } = {}

  // Messenger will use this endpoint to send webhooks events
  messengerRouter.post('/webhook', async (req, res) => {
    const body = req.body
    const botId = req.params.botId
    const config = await getModuleConfig(bp, botId)
    const verifyToken = getTokenFromConfig(config)

    // FIXME: should be called once and not every time the route is called
    // FIXME: Only callable by bot admin
    await setGetStarted(verifyToken, config.getStarted)
    await setGreeting(verifyToken, config.greeting)

    if (body.object === 'page') {
      for (const entry of body.entry) {
        // will only ever contain one message, so we get index 0
        const webhookEvent = entry.messaging[0]
        console.log(webhookEvent)
        const psid = webhookEvent.sender.id

        if (webhookEvent.message) {
          await handleMessage(psid, botId, webhookEvent.message, verifyToken)
        } else if (webhookEvent.postback) {
          await handleMessage(psid, botId, { text: webhookEvent.postback.payload }, verifyToken)
        }
      }

      res.status(200).send('EVENT_RECEIVED')
    } else {
      res.sendStatus(404)
    }
  })

  // Messenger will use this endpoint to verify the webhook authenticity
  messengerRouter.get('/webhook', async (req, res) => {
    const botId = req.params.botId
    const config = await getModuleConfig(bp, botId)
    const verifyToken = getTokenFromConfig(config)

    // Parse the query params
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === verifyToken) {
        bp.logger.debug('Webhook Verified.')
        res.status(200).send(challenge)
      } else {
        res.sendStatus(403)
      }
    } else {
      res.sendStatus(404)
    }
  })

  const handleMessage = async (psid, botId, message, token): Promise<void> => {
    const content = await bp.converse.sendMessage(botId, psid, message, channel)

    if (message.text) {
      // Responses are split into typing / content pairs
      for (let i = 0; i < content.responses.length; i += 2) {
        const isTyping = content.responses[i].value
        const message = content.responses[i + 1]

        isTyping && (await sendAction(psid, 'typing_on', token))
        await sendMessage(psid, message, token)
        isTyping && (await sendAction(psid, 'typing_off', token))
      }
    }
  }

  const sendAction = async (psid, action, token) => {
    const body = {
      recipient: {
        id: psid
      },
      sender_action: action
    }

    await http.post(`/messages`, body, { params: { access_token: token } })
  }

  const sendMessage = async (psid, message, token) => {
    const body = {
      recipient: {
        id: psid
      },
      message
    }

    await http.post(`/messages`, body, { params: { access_token: token } })
  }

  const callProfileApi = async (message, token) => {
    await http.post(`messenger_profile?access_token=${token}`, message)
  }

  const setGetStarted = async (token, message) => {
    if (!message) {
      return
    }

    const body = {
      get_started: {
        payload: message
      }
    }

    await callProfileApi(body, token)
  }

  const setGreeting = async (token, message) => {
    if (!message) {
      return
    }

    const payload = {
      greeting: [
        {
          locale: 'default',
          text: message
        }
      ]
    }
    await callProfileApi(payload, token)
  }

  const getModuleConfig = async (bp, botId): Promise<any> => {
    if (moduleConfigCache[botId]) {
      return moduleConfigCache[botId]
    }

    const config = await bp.config.getModuleConfigForBot('channel-messenger', botId)
    moduleConfigCache[botId] = config

    return config
  }

  const getTokenFromConfig = config => {
    if (!config.verifyToken) {
      throw new Error(`Please ensure the token is set in 'data/bots/<your_bot>/config/channel-messenger.json'.`)
    }
    return config.verifyToken
  }
}
