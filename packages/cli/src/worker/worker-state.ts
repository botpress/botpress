import type { ChildProcessWrapper } from './child-wrapper'

export type WorkerStatus = WorkerState['status']
export type WorkerState =
  | { status: 'errored'; thrown: unknown } // only occurs if the event error is emitted https://nodejs.org/api/child_process.html#event-error
  | { status: 'dead'; murdered: boolean }
  | { status: 'killing' }
  | { status: 'reloading' }
  | {
      status: 'live'
      child: ChildProcessWrapper
    }

export type StateOf<S extends WorkerStatus> = Extract<WorkerState, { status: S }>
export type WorkerStateHandler<S extends WorkerStatus> = (state: StateOf<S>) => void

export class WorkerStateObserver {
  private _state: WorkerState
  private _handlers: {
    [K in WorkerStatus]: WorkerStateHandler<K>[]
  } = {
    dead: [],
    reloading: [],
    live: [],
    killing: [],
    errored: [],
  }

  public constructor(initialState: WorkerState) {
    this._state = initialState
  }

  public waitFor<S extends WorkerStatus>(status: S): Promise<void> {
    return new Promise<void>((resolve) => {
      const cb = () => {
        this.off(status, cb)
        resolve()
      }
      this.on(status, cb)
    })
  }

  public on<S extends WorkerStatus>(status: S, handler: WorkerStateHandler<S>) {
    this._handlers[status].push(handler)
    if (this._state.status === status) {
      handler(this._state as StateOf<S>)
    }
  }

  public off<S extends WorkerStatus>(status: S, handler: WorkerStateHandler<S>) {
    const index = this._handlers[status].indexOf(handler)
    this._handlers[status].splice(index, 1)
  }

  public get() {
    return this._state
  }

  public set(newState: WorkerState) {
    this._state = newState
    const { status } = newState
    for (const handler of this._handlers[status]) {
      const fn = handler as WorkerStateHandler<typeof status>
      fn(newState)
    }
  }
}
