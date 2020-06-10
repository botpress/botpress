export class TrainingCanceledError extends Error {
  constructor() {
    super('Training cancelled')
    this.name = 'CancelError'
  }
}
