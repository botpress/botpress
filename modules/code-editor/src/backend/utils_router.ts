import * as sdk from 'botpress/sdk'

import { FileTypes } from './definitions'
import { EditableFile, FilePermissions } from './typings'
import { validateFilePayload } from './utils'

export const getPermissionsMw = (bp: typeof sdk) => async (req: any, res, next): Promise<void> => {
  const hasPermission = req => async (op: string, res: string) =>
    bp.http.hasPermission(req, op, 'module.code-editor.' + res)

  const permissionsChecker = hasPermission(req)

  const perms: FilePermissions = {}
  for (const type of Object.keys(FileTypes)) {
    const { allowGlobal, allowScoped, permission } = FileTypes[type]
    const globalKey = `global.${permission}`
    const botKey = `bot.${permission}`

    if (allowGlobal) {
      perms[globalKey] = {
        type,
        isGlobal: true,
        write: await permissionsChecker('write', globalKey),
        read: await permissionsChecker('read', globalKey)
      }
    }

    if (allowScoped) {
      perms[botKey] = {
        type,
        isGlobal: false,
        write: await permissionsChecker('write', botKey),
        read: await permissionsChecker('read', botKey)
      }
    }
  }

  req.permissions = perms
  next()
}

export const validateFilePayloadMw = async (req, res, next) => {
  if (!req.permissions || !req.body) {
    next(new Error(`Missing parameters`))
  }

  try {
    await validateFilePayload(req.body as EditableFile, req.permissions, req.params.botId)
    next()
  } catch (err) {
    next(err)
  }
}
