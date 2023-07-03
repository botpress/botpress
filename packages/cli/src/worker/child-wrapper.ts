import * as childProcess from 'child_process'
import type { Logger } from '../logger'
import { ENTRY_POINT } from './child-entrypoint'
import { CONFIG_ENV_KEY, Config } from './config'
import { CHILD_ENV_KEY, CHILD_ENV_VALUE, isChildProcess } from './is-child'

export type ChildOutput = {
  exitCode: number | null
  signal: NodeJS.Signals | null
}

const SPAWN_SHELL_ENV: Record<string, string> = {
  FORCE_COLOR: 'true', // well-known env var used by most shells to enable color output in child processes
} as const

const listenForChildSpawn = (child: childProcess.ChildProcess, logger: Logger) =>
  new Promise<void>((resolve, reject) => {
    child.on('spawn', () => {
      logger.debug(`Child process spawned with pid ${child.pid}`)
      resolve()
    })
    child.on('error', (err: Error) => {
      /**
       * The 'error' event is emitted whenever:
       *  - The process could not be spawned.
       *  - The child process was aborted via the signal option.
       */
      logger.debug(`Child process error: ${err.message}`)
      reject(err)
    })
  })

const listenForChildExit = (child: childProcess.ChildProcess, logger: Logger) =>
  new Promise<ChildOutput>((resolve, reject) => {
    child.on('disconnect', () => {
      logger.debug('Child process disconnected')
    })
    child.on('close', (exitCode: number | null, signal: NodeJS.Signals | null) => {
      /**
       * this event usually fires after exit unless stdio streams are shared across multiple processes.
       * see https://stackoverflow.com/questions/37522010/difference-between-childprocess-close-exit-events
       */
      logger.debug(`Child process closed with code ${exitCode} and signal ${signal}`)
    })
    child.on('exit', (exitCode: number | null, signal: NodeJS.Signals | null) => {
      logger.debug(`Child process exited with code ${exitCode} and signal ${signal}`)
      resolve({ exitCode, signal })
    })
    child.on('error', (err: Error) => {
      /**
       * The 'error' event is emitted whenever:
       *  - The process could not be killed.
       *  - The child process was aborted via the signal option.
       */
      logger.debug(`Child process error: ${err.message}`)
      reject(err)
    })
    child.on('message', (message) => {
      logger.debug(`Child process message: ${message}`)
    })
  })

/**
 * Wrapper above child_process.ChildProcess to simplify usage
 */
export class ChildProcessWrapper {
  public static async spawn(config: Config, logger: Logger): Promise<ChildProcessWrapper> {
    if (isChildProcess) {
      throw new Error('Cannot spawn child process from child process')
    }

    const child = childProcess.fork(ENTRY_POINT, [], {
      stdio: 'inherit',
      env: {
        ...SPAWN_SHELL_ENV,
        [CHILD_ENV_KEY]: CHILD_ENV_VALUE,
        [CONFIG_ENV_KEY]: JSON.stringify(config),
        ...config.env,
      },
    })

    const childSpawnPromise = listenForChildSpawn(child, logger)
    const childExitPromise = listenForChildExit(child, logger)

    const instance = new ChildProcessWrapper(child, childExitPromise)

    childExitPromise.finally(() => {
      instance._exited = true
    })

    await childSpawnPromise

    return instance
  }

  private _exited = false
  private constructor(private _child: childProcess.ChildProcess, private _exitPromise: Promise<ChildOutput>) {}

  public async kill(): Promise<ChildOutput> {
    if (this._exited) {
      throw new Error('Child process already exited and cannot be killed')
    }
    this._child.kill()
    const res = await this._exitPromise
    return res
  }

  public async listen(): Promise<ChildOutput> {
    if (this._exited) {
      throw new Error('Child process already exited and cannot be listened on')
    }
    const res = await this._exitPromise
    return res
  }
}
