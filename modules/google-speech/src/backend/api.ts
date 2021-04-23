import * as sdk from 'botpress/sdk'
import { Clients } from './typings'

export async function setupRouter(
  bp: typeof sdk,
  clients: Clients,
  moduleName: string
): Promise<sdk.http.RouterExtension> {
  const router = bp.http.createRouterForBot(moduleName, {
    checkAuthentication: false
  })

  router.post('/speech-to-text', async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send(`Bot ${botId} is not configured to use google-speech`)
    }

    const { mediaUrl, language } = req.body

    if (!mediaUrl || !language) {
      res.status(400).send("Missing required fields: 'mediaUrl', 'language'")
    }

    try {
      const text = await client.speechToText(mediaUrl, language)

      res.status(200).send({ text })
    } catch (err) {
      console.error(`Mod[${moduleName}] Server error: `, err)
      res.status(500).send(err)
    }
  })

  router.post('/text-to-speech', async (req, res) => {
    const { botId } = req.params
    const client = clients[botId]

    if (!client) {
      return res.status(404).send(`Bot ${botId} is not configured to use google-speech`)
    }

    const { text, language } = req.body

    if (!text || !language) {
      res.status(400).send("Missing required fields: 'text', , 'language'")
    }

    try {
      const audioFile = await client.textToSpeech(text, language)

      res.status(200).send({ audioFile })
    } catch (err) {
      console.error(`Mod[${moduleName}] Server error: `, err)
      res.status(500).send(err)
    }
  })

  return router
}
