export class EventEmitter<E extends object> {
  private listeners: {
    [K in keyof E]?: ((event: E[K]) => void)[]
  } = {}

  public emit<K extends keyof E>(type: K, event: E[K]) {
    const listeners = this.listeners[type]
    if (!listeners) {
      return
    }
    for (const listener of listeners) {
      listener(event)
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
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type]!.push(listener)
  }

  public off<K extends keyof E>(type: K, listener: (event: E[K]) => void) {
    const listeners = this.listeners[type]
    if (!listeners) {
      return
    }
    const index = listeners.indexOf(listener)
    if (index !== -1) {
      listeners.splice(index, 1)
    }
  }
}
