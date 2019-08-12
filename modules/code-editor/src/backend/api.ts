import * as sdk from 'botpress/sdk'

import { EditorByBot, FilePermissions } from './typings'

export default async (bp: typeof sdk, editorByBot: EditorByBot) => {
  const router = bp.http.createRouterForBot('code-editor')

  router.get('/files', async (req, res, next) => {
    const permissions = await getPermissions(req)

    try {
      res.send(await editorByBot[req.params.botId].fetchFiles(permissions))
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching files')
      next(err)
    }
  })

  router.get('/permissions', async (req, res, next) => {
    try {
      res.send(await getPermissions(req))
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching config')
      next(err)
    }
  })

  router.post('/save', async (req, res, next) => {
    try {
      const permissions = await getPermissions(req)
      await editorByBot[req.params.botId].saveFile(req.body, permissions)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not save file')
      next(err)
    }
  })

  router.put('/rename', async (req, res, next) => {
    const { file, newName } = req.body
    try {
      const permissions = await getPermissions(req)
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
      const permissions = await getPermissions(req)
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

  async function getPermissions(req: any): Promise<FilePermissions> {
    const hasPermission = req => async (op: string, res: string) =>
      bp.http.hasPermission(req, op, 'module.code-editor.' + res)

    const permissionsChecker = hasPermission(req)

    const readPermissions = {
      hooks: await permissionsChecker('read', 'global.hooks'),
      globalActions: await permissionsChecker('read', 'global.actions'),
      botActions: await permissionsChecker('read', 'bot.actions'),
      globalConfigs: await permissionsChecker('read', 'global.configs'),
      botConfigs: await permissionsChecker('read', 'bot.configs')
    }

    const writePermissions = {
      hooks: await permissionsChecker('write', 'global.hooks'),
      globalActions: await permissionsChecker('write', 'global.actions'),
      botActions: await permissionsChecker('write', 'bot.actions'),
      globalConfigs: await permissionsChecker('write', 'global.configs'),
      botConfigs: await permissionsChecker('write', 'bot.configs')
    }

    return { readPermissions, writePermissions }
  }
}
