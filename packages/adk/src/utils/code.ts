import { requireJsCode } from '@botpress/cli/dist/utils/require-utils'
import { buildEntrypoint } from '@botpress/cli/dist/utils/esbuild-utils'
import { Worker } from '@botpress/cli/dist/worker'
import { Logger } from '@botpress/cli/dist/logger'

export const loadCode = async (path: string, additionalCode = '') => {
  const buildResult = await buildEntrypoint(
    { absWorkingDir: '', entrypoint: path },
    { bundle: false, format: 'cjs', target: 'es2020', platform: 'neutral' }
  )

  if (buildResult.outputFiles.length !== 1) {
    throw new Error('Expected exactly one output file')
  }

  const outputFile = buildResult.outputFiles[0]

  if (!outputFile?.text) {
    throw new Error('Expected output file to have text')
  }

  const code = `${additionalCode}\n${outputFile.text}`

  const worker = await Worker.spawn({ type: 'code', code: '', env: {} }, new Logger())

  await worker.wait()

  return requireJsCode(code)
}
