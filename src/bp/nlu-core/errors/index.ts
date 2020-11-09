export class TrainingCanceled extends Error {}
export class TrainingAlreadyStarted extends Error {}

export function isTrainingCanceled(err: Error): err is TrainingCanceled {
  return err instanceof TrainingCanceled
}

export function isTrainingAlreadyStarted(err: Error): err is TrainingAlreadyStarted {
  return err instanceof TrainingAlreadyStarted
}
