import express from 'express'
import { createServer } from 'http'
import fse from 'fs-extra'
import path from 'path'
import axios from 'axios'
import portFinder from 'portfinder'

require('dotenv').config({ path: path.resolve('./dist/.env') })

const messagingEndpoint = process.env.MESSAGING_ENDPOINT || 'https://messaging.botpress.dev'

const injectMesagingInfos = (clientId: string) => {
  const html = fse.readFileSync('./scripts/assets/chat.html').toString()
  return html.replace('MESSAGING_ENDPOINT_URL', messagingEndpoint).replace('CLIENT_ID', clientId || '')
}

const getClientId = async (botId: string) => {
  if (!botId) {
    return
  }

  const configPath = `./dist/data/bots/${botId}/bot.config.json`
  if (!fse.pathExistsSync(configPath)) {
    return
  }

  const config = fse.readJsonSync(configPath)

  if (!config.messaging) {
    console.info('No messaging configuration found, creating a new one... ')
    config.messaging = await createMessagingClient()

    return fse.writeJsonSync(configPath, config)
  }

  const { id, token } = config.messaging
  if (await areCredentialsValid(id, token)) {
    console.info(`Using client ${id}`)
    return id
  } else {
    console.info(`Client ${id} doesn't exist, creating a new one...`)

    config.messaging = await createMessagingClient()
    console.info(`Created client ${config.messaging.id}`)

    fse.writeJsonSync(configPath, config)
    return config.messaging.id
  }
}

const areCredentialsValid = async (clientId: string, token: string) => {
  try {
    await axios.get(`${messagingEndpoint}/api/v1/health`, {
      headers: { 'x-bp-messaging-client-id': clientId, 'x-bp-messaging-client-token': token }
    })
    return true
  } catch (err) {
    return false
  }
}

const createMessagingClient = async (clientId?: string): Promise<{ id: string; token: string }> => {
  const { data } = await axios.post(`${messagingEndpoint}/api/v1/admin/clients`, { id: clientId })
  return data
}

const app = express()

app.get('/:botId?', async (req, res) => {
  const clientId = await getClientId(req.params.botId)
  const html = injectMesagingInfos(clientId)

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

const init = async () => {
  const port = await portFinder.getPortPromise({ port: 5000 })

  const httpServer = createServer(app)
  httpServer.listen(port, undefined)

  console.info(`Listening on http://localhost:${port}`)
}

init()
