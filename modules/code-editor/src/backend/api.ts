import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import Editor from './editor'
import { RequestWithPerms } from './typings'
import { getPermissionsMw, validateFilePayloadMw } from './utils_router'

const debugRead = DEBUG('audit:code-editor:read')
const debugWrite = DEBUG('audit:code-editor:write')

export default async (bp: typeof sdk, editor: Editor) => {
  const loadPermsMw = getPermissionsMw(bp)
  const router = bp.http.createRouterForBot('code-editor')

  const audit = (debugMethod: Function, label: string, req: RequestWithPerms, args?: any) => {
    debugMethod(
      `${label} %o`,
      _.merge(
        {
          ip: req.ip,
          user: _.pick(req.tokenUser, ['email', 'strategy', 'isSuperAdmin']),
          file: {
            ..._.pick(req.body.file || req.body, ['location', 'botId', 'type', 'hookType']),
            size: (req.body.file || req.body)?.content?.length
          }
        },
        args
      )
    )
  }

  router.get('/files', loadPermsMw, async (req: RequestWithPerms, res, next) => {
    try {
      const rawFiles = req.query.rawFiles === 'true'
      const includeBuiltin = req.query.includeBuiltin === 'true'
      res.send(await editor.forBot(req.params.botId).getAllFiles(req.permissions, rawFiles, includeBuiltin))
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching files')
      next(err)
    }
  })

  router.post('/save', loadPermsMw, validateFilePayloadMw('write'), async (req: RequestWithPerms, res, next) => {
    try {
      audit(debugWrite, 'saveFile', req)

      await editor.forBot(req.params.botId).saveFile(req.body)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not save file')
      next(err)
    }
  })

  router.post('/readFile', loadPermsMw, validateFilePayloadMw('read'), async (req: RequestWithPerms, res, next) => {
    try {
      const fileContent = await editor.forBot(req.params.botId).readFileContent(req.body)

      audit(debugRead, 'readFile', req, { file: { size: fileContent?.length } })

      res.send({ fileContent })
    } catch (err) {
      next(err)
    }
  })

  router.post('/download', loadPermsMw, validateFilePayloadMw('read'), async (req: RequestWithPerms, res, next) => {
    const buffer = await editor.forBot(req.params.botId).readFileBuffer(req.body)

    res.setHeader('Content-Disposition', `attachment; filename=${req.body.name}`)
    res.setHeader('Content-Type', 'application/octet-stream')
    res.send(buffer)
  })

  router.post('/exists', loadPermsMw, validateFilePayloadMw('write'), async (req: RequestWithPerms, res, next) => {
    try {
      res.send(await editor.forBot(req.params.botId).fileExists(req.body))
    } catch (err) {
      next(err)
    }
  })

  router.post('/rename', loadPermsMw, validateFilePayloadMw('write'), async (req: RequestWithPerms, res, next) => {
    try {
      audit(debugWrite, 'renameFile', req, { newName: req.body.newName })

      await editor.forBot(req.params.botId).renameFile(req.body.file, req.body.newName)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not rename file')
      next(err)
    }
  })

  router.post('/remove', loadPermsMw, validateFilePayloadMw('write'), async (req: RequestWithPerms, res, next) => {
    try {
      audit(debugWrite, 'deleteFile', req)

      await editor.forBot(req.params.botId).deleteFile(req.body)
      res.sendStatus(200)
    } catch (err) {
      bp.logger.attachError(err).error('Could not delete file')
      next(err)
    }
  })

  router.get('/permissions', loadPermsMw, async (req: RequestWithPerms, res, next) => {
    try {
      res.send(req.permissions)
    } catch (err) {
      bp.logger.attachError(err).error('Error fetching permissions')
      next(err)
    }
  })

  router.get('/typings', async (_req, res, next) => {
    try {
      res.send(await editor.loadTypings())
    } catch (err) {
      bp.logger.attachError(err).error('Could not load typings. Code completion will not be available')
      next(err)
    }
  })
}
