import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import * as path from 'path'

async function computeRemotePackageChecksum(args: {
  createdAt: string
  name: string
  version: string
  type: 'plugin' | 'integration' | 'interface'
}): Promise<string> {
  const payload = JSON.stringify({ type: args.type, version: args.version, createdAt: args.createdAt })
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}

async function _getFolderMetadata(folderPath: string): Promise<{ files: string[]; stats: Record<string, any> }> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true })
  const files: string[] = []
  const stats: Record<string, any> = {}

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name)
    if (entry.isFile()) {
      files.push(entry.name)
      const stat = await fs.stat(fullPath)
      stats[entry.name] = {
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        ctimeMs: stat.ctimeMs,
      }
    }
  }

  return { files: files.sort(), stats }
}

async function computeLocalPackageChecksum(args: { path: string }) {
  const { path: folderPath } = args
  const folderName = path.basename(folderPath)
  const metadata = await this._getFolderMetadata(folderPath)
  const payload = JSON.stringify({ folderName, ...metadata })
  return createHash('sha256').update(payload, 'utf8').digest('hex')
}
