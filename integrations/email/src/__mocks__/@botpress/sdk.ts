export class RuntimeError extends Error {
  type = 'Runtime' as const
  constructor(message: string) {
    super(message)
    this.name = 'RuntimeError'
  }
}
