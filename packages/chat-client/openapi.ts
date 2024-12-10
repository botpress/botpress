import { api } from '@botpress/chat-api'
import pathlib from 'path'

const main = async (argv: string[]) => {
  const outDir = argv[0]
  if (!outDir) {
    throw new Error('Missing output directory')
  }
  const clientDir = pathlib.join(outDir, 'client')
  const signalsDir = pathlib.join(outDir, 'signals')
  await api.exportClient(clientDir, { generator: 'opapi' })
  await api.signals.exportSchemas(signalsDir)
}

void main(process.argv.slice(2))
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
