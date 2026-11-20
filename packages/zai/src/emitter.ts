const reportListenerError = (error: unknown) => {
  try {
    console.error('[zai] An event listener threw an error:', error)
  } catch {}
}

export class EventEmitter<E extends object> {
  private _listeners: {
    [K in keyof E]?: ((event: E[K]) => void)[]
  } = {}

  public emit<K extends keyof E>(type: K, event: E[K]) {
    const listeners = this._listeners[type]
    if (!listeners) {
      return
    }
    // Iterate over a copy: `once` listeners remove themselves while we iterate.
    // A throwing listener must not prevent other listeners from running nor break the emitter's caller.
    for (const listener of [...listeners]) {
      try {
        listener(event)
      } catch (error: unknown) {
        reportListenerError(error)
      }
    }
  }

  public once<K extends keyof E>(type: K, listener: (event: E[K]) => void) {
    const wrapped = (event: E[K]) => {
      this.off(type, wrapped)
      listener(event)
    }
    this.on(type, wrapped)
  }

  public on<K extends keyof E>(type: K, listener: (event: E[K]) => void) {
    if (!this._listeners[type]) {
      this._listeners[type] = []
    }
    this._listeners[type]!.push(listener)
  }

  public off<K extends keyof E>(type: K, listener: (event: E[K]) => void) {
    const listeners = this._listeners[type]
    if (!listeners) {
      return
    }
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
  }

  public clear<K extends keyof E>(type?: K) {
    if (type) {
      delete this._listeners[type]
    } else {
      this._listeners = {}
    }
  }
}
