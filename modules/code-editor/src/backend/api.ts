import * as sdk from 'botpress/sdk'

import { EditorByBot } from './typings'

export default async (bp: typeof sdk, editorByBot: EditorByBot) => {
  const router = bp.http.createRouterForBot('code-editor')

  router.get('/files', async (req, res) => {
    try {
      res.send(await editorByBot[req.params.botId].fetchFiles())
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching files')
      res.sendStatus(500)
    }
  })

  router.post('/save', async (req, res) => {
    try {
      await editorByBot[req.params.botId].saveFile(req.body)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not save file')
      res.sendStatus(500)
    }
  })

  router.get('/typings', async (req, res) => {
    try {
      res.send(await editorByBot[req.params.botId].loadTypings())
    } catch (err) {
      bp.logger.attachError(err).error('Could not load typings. Code completion will not be available')
      res.sendStatus(500)
    }
  })
}
