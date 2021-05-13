export class TrainingCanceledError extends Error {
  constructor() {
    super('Training Canceled')
  }
}

export class TrainingAlreadyStartedError extends Error {
  constructor() {
    super('Training Already Started')
  }
}
