export interface Semaphore {
  running: number
  queue: Array<() => void>
  acquire(): Promise<void>
  release(): void
}

export const createSemaphore = (maxConcurrent: number): Semaphore => {
  return {
    running: 0,
    queue: [],
    async acquire() {
      if (this.running >= maxConcurrent) {
        await new Promise<void>((resolve) => this.queue.push(resolve))
      }
      this.running++
    },
    release() {
      this.running--
      const next = this.queue.shift()
      if (next) next()
    },
  }
}
