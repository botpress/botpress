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

  router.put('/rename/:newName', async (req, res) => {
    const file = req.body
    const newName = req.params.newName
    try {
      const updatedFile = await editorByBot[req.params.botId].renameFile(file, newName)
      if (!updatedFile) {
        res.sendStatus(409) // conflict, file already exists
        return
      }
      res.sendStatus(200)
    } catch (err) {
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
