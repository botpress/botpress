import { api } from '@botpress/chat-api'
import fs from 'fs'
import path from 'path'

const main = async (argv: string[]) => {
  const outDir = argv[0]
  if (!outDir) {
    throw new Error('Missing output directory')
  }

  console.info('Generating OpenAPI server...')

  await api.exportHandler(outDir)

  const signalsDir = path.join(outDir, 'signals')
  await api.signals.exportSchemas(signalsDir, { includeZodSchemas: false })

  const versionDir = path.join(outDir, 'version.ts')
  await fs.promises.writeFile(versionDir, `export const apiVersion = "${api.version}"`)

  console.info('OpenAPI server generated')
}

void main(process.argv.slice(2))
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
