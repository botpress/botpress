import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, BPRequest, UnexpectedError } from 'common/http'
import { ALL_BOTS } from 'common/utils'
import _ from 'lodash'
import multer from 'multer'
import path from 'path'

import Editor from './editor'
import { RequestWithPerms } from './typings'
import { getPermissionsMw, validateFilePayloadMw, validateFileUploadMw } from './utils_router'

const debugRead = DEBUG('audit:code-editor:read')
const debugWrite = DEBUG('audit:code-editor:write')

export default async (bp: typeof sdk, editor: Editor) => {
  const loadPermsMw = getPermissionsMw(bp)
  const asyncMiddleware = asyncMw(bp.logger)
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

  router.get(
    '/files',
    loadPermsMw,
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res) => {
      try {
        const rawFiles = req.query.rawFiles === 'true'
        const includeBuiltin = req.query.includeBuiltin === 'true'

        let permissions = req.permissions

        // Removing bot-specific permissions so we retrieve only global files (for all bots)
        if (req.params.botId === ALL_BOTS && !rawFiles) {
          permissions = Object.entries(req.permissions).reduce((perms, [key, val]) => {
            if (val.isGlobal) {
              perms[key] = val
            }
            return perms
          }, {})
        }

        res.send(await editor.forBot(req.params.botId).getAllFiles(permissions, rawFiles, includeBuiltin))
      } catch (err) {
        throw new UnexpectedError('Error fetching files', err)
      }
    })
  )

  router.post(
    '/save',
    loadPermsMw,
    validateFilePayloadMw('write'),
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res) => {
      try {
        audit(debugWrite, 'saveFile', req)

        await editor.forBot(req.params.botId).saveFile(req.body)
        res.sendStatus(200)
      } catch (err) {
        throw new UnexpectedError('Cannot save file', err)
      }
    })
  )

  router.post(
    '/readFile',
    loadPermsMw,
    validateFilePayloadMw('read'),
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res) => {
      try {
        const fileContent = await editor.forBot(req.params.botId).readFileContent(req.body)

        audit(debugRead, 'readFile', req, { file: { size: fileContent?.length } })

        res.send({ fileContent })
      } catch (err) {
        throw new UnexpectedError('Error reading file', err)
      }
    })
  )

  router.post(
    '/download',
    loadPermsMw,
    validateFilePayloadMw('read'),
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res, next) => {
      const buffer = await editor.forBot(req.params.botId).readFileBuffer(req.body)

      res.setHeader('Content-Disposition', `attachment; filename=${req.body.name}`)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.send(buffer)
    })
  )

  router.post(
    '/exists',
    loadPermsMw,
    validateFilePayloadMw('write'),
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res, next) => {
      try {
        res.send(await editor.forBot(req.params.botId).fileExists(req.body))
      } catch (err) {
        next(err)
      }
    })
  )

  router.post(
    '/rename',
    loadPermsMw,
    validateFilePayloadMw('write'),
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res) => {
      try {
        audit(debugWrite, 'renameFile', req, { newName: req.body.newName })

        await editor.forBot(req.params.botId).renameFile(req.body.file, req.body.newName)
        res.sendStatus(200)
      } catch (err) {
        throw new UnexpectedError('Could not rename file', err)
      }
    })
  )

  router.post(
    '/remove',
    loadPermsMw,
    validateFilePayloadMw('write'),
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res, next) => {
      try {
        audit(debugWrite, 'deleteFile', req)

        await editor.forBot(req.params.botId).deleteFile(req.body)
        res.sendStatus(200)
      } catch (err) {
        throw new UnexpectedError('Could not delete file', err)
      }
    })
  )

  router.post(
    '/upload',
    loadPermsMw,
    validateFileUploadMw,
    multer().single('file'),
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res) => {
      const folder = path.dirname(req.body.location)
      const filename = path.basename(req.body.location)

      try {
        await bp.ghost.forRoot().upsertFile(folder, filename, req.file.buffer)
        res.sendStatus(200)
      } catch (err) {
        throw new UnexpectedError('Could not upload file', err)
      }
    })
  )

  router.get(
    '/permissions',
    loadPermsMw,
    asyncMiddleware(async (req: BPRequest & RequestWithPerms, res) => {
      try {
        res.send(req.permissions)
      } catch (err) {
        throw new UnexpectedError('Could not fetch permissions', err)
      }
    })
  )

  router.get(
    '/typings',
    asyncMiddleware(async (_req, res) => {
      try {
        res.send(await editor.loadTypings())
      } catch (err) {
        throw new UnexpectedError('Could not load typings. Code completion will not be available', err)
      }
    })
  )
}
