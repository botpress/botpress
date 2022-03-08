import express from 'express'
import { createServer } from 'http'
import fse from 'fs-extra'
import path from 'path'
import axios from 'axios'

require('dotenv').config({ path: path.resolve('./dist/.env') })

const messagingEndpoint = process.env.MESSAGING_ENDPOINT || 'https://messaging.botpress.dev'

const fixMessagingHtml = (clientId?: string) => {
  const html = fse.readFileSync('./scripts/chat.html').toString()
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
    config.messaging = await createMessagingId()

    return fse.writeJsonSync(configPath, config)
  }

  const { id, token } = config.messaging
  if (await isRegistered(id, token)) {
    console.info(`Client ${id} is properly registered`)
    return id
  } else {
    console.info(`Client ${id} is not properly registered, creating a new id/token pair...`)

    config.messaging = await createMessagingId()
    console.info(`Created client ${config.messaging.id}`)

    fse.writeJsonSync(configPath, config)
    return config.messaging.id
  }
}

const isRegistered = async (clientId: string, token: string) => {
  try {
    await axios.get(`${messagingEndpoint}/api/v1/health`, {
      headers: { 'x-bp-messaging-client-id': clientId, 'x-bp-messaging-client-token': token }
    })
    return true
  } catch (err) {
    return false
  }
}

const createMessagingId = async (clientId?: string): Promise<{ id: string; token: string }> => {
  const { data } = await axios.post(`${messagingEndpoint}/api/v1/admin/clients`, { id: clientId })
  return data
}

const app = express()

app.get('/:botId?', async (req, res) => {
  const clientId = await getClientId(req.params.botId)
  const html = fixMessagingHtml(clientId)

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
})

const httpServer = createServer(app)
httpServer.listen(5000, undefined)

console.info('Listening on http://localhost:5000')
