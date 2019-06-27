import * as sdk from 'botpress/sdk'

import { EditorErrorStatus } from './editorError'
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

  router.get('/config', async (req, res) => {
    try {
      res.send({ isGlobalAllowed: await editorByBot[req.params.botId].isGlobalAllowed() })
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching config')
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

  router.put('/rename', async (req, res) => {
    const { file, newName } = req.body
    try {
      await editorByBot[req.params.botId].renameFile(file, newName)
      res.sendStatus(200)
    } catch (err) {
      if (err.status === EditorErrorStatus.FILE_ALREADY_EXIST) {
        res.sendStatus(409) // conflict, file already exists
        return
      }
      if (err.status === EditorErrorStatus.INVALID_NAME) {
        res.sendStatus(412) // pre-condition fail, invalid filename
        return
      }

      bp.logger.attachError(err).error('Could not rename file')
      res.sendStatus(500)
    }
  })

  // not REST, but need the whole file info in the body
  router.post('/remove', async (req, res) => {
    const file = req.body
    try {
      await editorByBot[req.params.botId].deleteFile(file)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not delete file')
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
