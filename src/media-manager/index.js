import path from 'path'
import { safeId } from '../util'

const defaultDir = './media'

module.exports = ({ botfile, logger, ghostManager, projectLocation }) => {
  const mediaDir = path.resolve(projectLocation, botfile.mediaDir || defaultDir)

  ghostManager.addRootFolder(mediaDir, { isBinary: true })

  const saveFile = async (filename, buffer) => {
    filename = `${safeId(20)}-${path.basename(filename)}`
    await ghostManager.upsertFile(mediaDir, filename, buffer)
    return filename
  }

  const readFile = filename => ghostManager.readFile(mediaDir, filename)

  return { saveFile, readFile }
}
