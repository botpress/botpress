export class TrainingCanceled extends Error {}
export function isTrainingCanceled(err: Error): err is TrainingCanceled {
  return err instanceof TrainingCanceled
}

export class TrainingAlreadyStarted extends Error {}
export function isTrainingAlreadyStarted(err: Error): err is TrainingAlreadyStarted {
  return err instanceof TrainingAlreadyStarted
}

export class TrainingExitedUnexpectedly extends Error {
  constructor(srcWorkerId: number, info: { exitCode: number; signal: string }) {
    const { exitCode, signal } = info
    super(`Training worker ${srcWorkerId} exited with exit code ${exitCode} and signal ${signal}.`)
  }
}

export class ModelLoadingError extends Error {
  constructor(component: string, innerError: Error | undefined) {
    super(`${component} could load model. Inner error is: "${innerError?.message}"`)
  }
}
