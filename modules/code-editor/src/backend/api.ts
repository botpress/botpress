import * as sdk from 'botpress/sdk'

import { EditorByBot } from './typings'

export default async (bp: typeof sdk, editorByBot: EditorByBot) => {
  const router = bp.http.createRouterForBot('code-editor')

  router.get('/files', async (req, res, next) => {
    try {
      res.send(await editorByBot[req.params.botId].fetchFiles())
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching files')
      next(err)
    }
  })

  router.get('/config', async (req, res, next) => {
    const { allowGlobal, includeBotConfig } = editorByBot[req.params.botId].getConfig()
    try {
      res.send({ isGlobalAllowed: allowGlobal, isBotConfigIncluded: includeBotConfig })
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching config')
      next(err)
    }
  })

  router.post('/save', async (req, res, next) => {
    try {
      await editorByBot[req.params.botId].saveFile(req.body)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not save file')
      next(err)
    }
  })

  router.put('/rename', async (req, res, next) => {
    const { file, newName } = req.body
    try {
      await editorByBot[req.params.botId].renameFile(file, newName)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not rename file')
      next(err)
    }
  })

  // not REST, but need the whole file info in the body
  router.post('/remove', async (req, res, next) => {
    const file = req.body
    try {
      await editorByBot[req.params.botId].deleteFile(file)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not delete file')
      next(err)
    }
  })

  router.get('/typings', async (req, res, next) => {
    try {
      res.send(await editorByBot[req.params.botId].loadTypings())
    } catch (err) {
      bp.logger.attachError(err).error('Could not load typings. Code completion will not be available')
      next(err)
    }
  })
}
