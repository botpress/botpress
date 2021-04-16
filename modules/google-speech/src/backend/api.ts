import * as sdk from 'botpress/sdk'
import { GoogleSpeechClient } from './client'

export async function setupRouter(
  bp: typeof sdk,
  client: GoogleSpeechClient,
  moduleName: string
): Promise<sdk.http.RouterExtension> {
  const router = bp.http.createRouterForBot(moduleName, {
    checkAuthentication: false
  })

  router.post('/speech-to-text', async (req, res) => {
    try {
      const { mediaUrl } = req.body

      if (!mediaUrl) {
        res.status(400).send('Missing required field mediaUrl')
      }

      const text = await client.speechToText(mediaUrl)

      res.status(200).send({ text })
    } catch (err) {
      console.error(`Mod[${moduleName}] Server error: `, err)
      res.status(500).send(err)
    }
  })

  router.post('/text-to-speech', async (req, res) => {
    try {
      const { text } = req.body

      if (!text) {
        res.status(400).send('Missing required field text')
      }

      const audioFile = await client.textToSpeech(text)

      res.status(200).send({ audioFile })
    } catch (err) {
      console.error(`Mod[${moduleName}] Server error: `, err)
      res.status(500).send(err)
    }
  })

  return router
}
