import { ChildProcess, fork } from 'child_process'
import path from 'path'
import { VError } from 'verror'

export type LaunchOptions = {
  /** Maximum run time for the action in milliseconds
   * Passed this threshold, the launcher will kill the script and throw a TimeoutError
   */
  timeout?: number
  allowedImports?: string[]
}

export const runCode = (code: string, args: any, options?: LaunchOptions) => {
  options = { timeout: 1000, allowedImports: [], ...(options || {}) }

  return new Promise((resolve, reject) => {
    let timerRef: NodeJS.Timer
    let proc: ChildProcess

    const cleanup = () => {
      timerRef && clearTimeout(timerRef)
      if (proc && !proc.killed) {
        proc.kill('SIGKILL') // Terminate immediately/hard kill
      }
    }

    // If you change this line, don't forget to include the runtime file
    // As an "asset" for pkg, otherwise the runtime won't be available
    // In the packaged version of Botpress
    const sandboxPath = path.join(__dirname, 'sandbox-runtime.js')

    proc = fork(sandboxPath, [], { env: {} })

    proc.on('unhandledRejection', err => {
      reject(new VError(err, 'Sandbox crashed'))
      cleanup()
    })

    proc.on('exit', () => {
      resolve()
      cleanup()
    })

    proc.on('error', err => {
      reject(new VError(err, 'Sandbox crashed'))
      cleanup()
    })

    proc.on('message', msg => {
      if (!msg || typeof msg.success === 'undefined') {
        return
      }

      if (msg.success) {
        resolve(msg.result)
      } else {
        reject(msg.error)
      }

      cleanup()
    })

    proc.send({ action: 'run', code: code, args })

    timerRef = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out exceeded'))
    }, options!.timeout!)
  })
}
