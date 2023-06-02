import type { Logger } from '../logger'
import { ChildProcessWrapper } from './child-wrapper'
import type { Config } from './config'
import { WorkerStateObserver } from './worker-state'

export type WorkerProps = {
  hangOnExit?: boolean
}

export class Worker {
  public static async spawn(config: Config, logger: Logger, props?: Partial<WorkerProps>): Promise<Worker> {
    const instance = new Worker(config, logger, props)
    await instance.reload()
    return instance
  }

  private _state = new WorkerStateObserver({ status: 'dead', murdered: false })

  private constructor(private _config: Config, private _logger: Logger, private _props: Partial<WorkerProps> = {}) {}

  /**
   * Used to determine if the worker can be killed
   */
  public get running() {
    return this._state.get().status === 'live'
  }

  public kill = () => {
    const state = this._state.get()
    if (state.status !== 'live') {
      throw new Error('Cannot kill a child process that is not alive')
    }

    this._state.set({ status: 'killing' })
    return state.child.kill()
  }

  public reload = async () => {
    if (this._state.get().status === 'reloading') {
      this._logger.debug('Already reloading')
      return
    }

    const previousState = this._state.get()
    this._state.set({ status: 'reloading' })

    if (previousState.status === 'live') {
      await previousState.child.kill()
    }

    const child = await ChildProcessWrapper.spawn(this._config, this._logger)
    this._state.set({ status: 'live', child })

    void child
      .listen()
      .catch((thrown) => {
        this._state.set({ status: 'errored', thrown })
      })
      .then(() => {
        const { status } = this._state.get()
        if (status === 'reloading') {
          return
        }
        this._state.set({ status: 'dead', murdered: status === 'killing' })
      })
  }

  public wait = () =>
    new Promise<void>((resolve, reject) => {
      this._state.on('dead', (state) => {
        if (state.murdered || !this._props.hangOnExit) {
          resolve()
          return
        }

        this._logger.debug('Child process died of natural causes...')
      })

      this._state.on('errored', (state) => {
        reject(state.thrown)
      })
    })
}
