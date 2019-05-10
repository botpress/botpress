import * as sdk from 'botpress/sdk'

import { EditorByBot } from './typings'

export default async (bp: typeof sdk, editorByBot: EditorByBot) => {
  const router = bp.http.createRouterForBot('code-editor')

  router.get('/files', async (req, res) => {
    res.send(await editorByBot[req.params.botId].fetchFiles())
  })

  router.post('/save', async (req, res) => {
    editorByBot[req.params.botId].saveFile(req.body)
    res.sendStatus(200)
  })

  router.get('/typings', async (req, res) => {
    res.send(await editorByBot[req.params.botId].loadTypings())
  })
}
