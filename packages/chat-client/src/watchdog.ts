export class WatchDog {
  private _listeners: ((error: Error) => void)[] = []
  private _handle: ReturnType<typeof setTimeout> | null = null

  private constructor(private _ms: number) {}

  public static init = (ms: number): WatchDog => {
    const inst = new WatchDog(ms)
    inst.reset()
    return inst
  }

  public reset() {
    if (this._handle) {
      clearTimeout(this._handle)
    }
    this._handle = setTimeout(() => {
      this._emitError(new Error('Client connection timed out'))
    }, this._ms)
  }

  public on(_type: 'error', listener: (error: Error) => void) {
    this._listeners.push(listener)
  }

  public close() {
    if (this._handle) {
      clearTimeout(this._handle)
    }
    this._listeners = []
  }

  private _emitError(error: Error) {
    for (const listener of this._listeners) {
      listener(error)
    }
  }
}
