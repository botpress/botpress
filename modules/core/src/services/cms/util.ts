import tmp from 'tmp'
import { NodeVM } from 'vm2'

export function safeEvalToObject<T>(code: string, executionPath?: string): T {
  const vm = new NodeVM({
    compiler: 'javascript',
    sandbox: {},
    timeout: 1000,
    console: 'redirect',
    sourceExtensions: ['.js'],
    nesting: false,
    require: { builtin: [], external: false, context: 'sandbox', import: [] }
  })

  let tmpFile: tmp.SynchrounousResult

  if (!executionPath) {
    tmpFile = tmp.fileSync({ prefix: 'sandbox-' })
    executionPath = tmpFile.name
  }

  try {
    return <T>vm.run(code, executionPath)
  } finally {
    if (tmpFile) {
      tmpFile.removeCallback()
    }
  }
}
