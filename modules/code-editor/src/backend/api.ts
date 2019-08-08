import * as sdk from 'botpress/sdk'

import { EditorByBot } from './typings'

export default async (bp: typeof sdk, editorByBot: EditorByBot) => {
  const router = bp.http.createRouterForBot('code-editor')

  router.get('/files', async (req, res, next) => {
    const editor = editorByBot[req.params.botId]
    const permissions = await editor.getPermissions(req)

    try {
      res.send(await editor.fetchFiles(permissions))
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching files')
      next(err)
    }
  })

  router.get('/permissions', async (req, res, next) => {
    try {
      const editor = editorByBot[req.params.botId]
      res.send(await editor.getPermissions(req))
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching config')
      next(err)
    }
  })

  router.post('/save', async (req, res, next) => {
    try {
      const editor = editorByBot[req.params.botId]
      const permissions = await editor.getPermissions(req)
      await editor.saveFile(req.body, permissions)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not save file')
      next(err)
    }
  })

  router.put('/rename', async (req, res, next) => {
    const { file, newName } = req.body
    try {
      const editor = editorByBot[req.params.botId]
      const permissions = await editor.getPermissions(req)
      await editorByBot[req.params.botId].renameFile(file, newName, permissions)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not rename file')
      next(err)
    }
  })

  router.post('/remove', async (req, res, next) => {
    const file = req.body
    try {
      const editor = editorByBot[req.params.botId]
      const permissions = await editor.getPermissions(req)
      await editorByBot[req.params.botId].deleteFile(file, permissions)
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
