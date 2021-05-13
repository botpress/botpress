import tar from 'tar'
import { VError } from 'verror'

export const createArchive = async (fileName: string, folder: string, files: string[]): Promise<string> => {
  try {
    await tar.create(
      {
        cwd: folder,
        file: fileName,
        portable: true,
        gzip: true
      },
      files
    )
    return fileName
  } catch (err) {
    throw new VError(err, `[Archive] Error creating archive "${fileName}"`)
  }
}
