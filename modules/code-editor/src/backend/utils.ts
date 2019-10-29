import _ from 'lodash'

import { FileDefinition, FileTypes } from './definitions'
import { FILENAME_REGEX } from './editor'
import { EditorError } from './editorError'
import { EditableFile, FilePermissions } from './typings'

export const filterBuiltin = (files: EditableFile[]) => {
  return files.filter(x => !x.content.includes('//CHECKSUM:'))
}

export const getFileLocation = (file: EditableFile): { folder: string; filename: string } => {
  const fileDef: FileDefinition = FileTypes[file.type]
  const { baseDir, upsertLocation, upsertFilename } = fileDef.ghost

  const folder = (upsertLocation && upsertLocation(file)) || baseDir
  const filename = (upsertFilename && upsertFilename(file)) || file.location

  return { folder, filename }
}

export const assertValidJson = (content: string): boolean => {
  try {
    JSON.parse(content)
    return true
  } catch (err) {
    throw new EditorError(`Invalid JSON file. ${err}`)
  }
}

export const assertValidFilename = (filename: string) => {
  if (!FILENAME_REGEX.test(filename)) {
    throw new EditorError('Filename has invalid characters')
  }
}

export const arePermissionsValid = (
  def: FileDefinition,
  editableFile: EditableFile,
  permissions: FilePermissions
): boolean => {
  const hasGlobalPerm = def.allowGlobal && permissions[`global.${def.permission}`].write
  const hasScopedPerm = def.allowScoped && permissions[`bot.${def.permission}`].write

  const isGlobalValid = def.allowGlobal && !editableFile.botId
  const isScopedValid = def.allowScoped && !!editableFile.botId

  return (hasGlobalPerm && isGlobalValid) || (hasScopedPerm && isScopedValid)
}

export const validateFilePayload = async (
  editableFile: EditableFile,
  permissions: FilePermissions,
  currentBotId: string
) => {
  const { name, botId, type, content, location } = editableFile

  const def: FileDefinition = FileTypes[type]
  if (!def) {
    throw new EditorError(`Invalid file type "${type}", only ${Object.keys(FileTypes)} are allowed at the moment`)
  }

  if (botId && botId.length && botId !== currentBotId) {
    throw new EditorError(`Can't perform modification on bot ${botId}. Please switch to the correct bot to change it.`)
  }

  if (!arePermissionsValid(def, editableFile, permissions)) {
    throw new EditorError(`No permission`)
  }

  if (def.isJSON) {
    assertValidJson(content)
  }

  if (def.validate) {
    const result = await def.validate(editableFile)
    if (result) {
      throw new Error(result)
    }
  }

  if (def.filenames && !def.filenames.includes(location)) {
    throw new EditorError(`Invalid file name. Must match ${def.filenames}`)
  }

  assertValidFilename(name)
}

export const buildRestrictedProcessVars = () => {
  const exposedEnv = {
    ..._.pickBy(process.env, (_value, name) => name.startsWith('EXPOSED_')),
    ..._.pick(process.env, 'TZ', 'LANG', 'LC_ALL', 'LC_CTYPE')
  }
  const root = extractInfo(_.pick(process, 'HOST', 'PORT', 'EXTERNAL_URL', 'PROXY'))
  const exposed = extractInfo(exposedEnv)

  return `
  declare var process: RestrictedProcess;
  interface RestrictedProcess {
    ${root.map(x => {
      return `/** Current value: ${x.value} */
${x.name}: ${x.type}
`
    })}

    env: {
      ${exposed.map(x => {
        return `/** Current value: ${x.value} */
${x.name}: ${x.type}
`
      })}
    }
  }`
}

const extractInfo = keys => {
  return Object.keys(keys).map(name => {
    return { name, value: keys[name], type: typeof keys[name] }
  })
}
