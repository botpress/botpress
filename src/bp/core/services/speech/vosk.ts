// Vosk doesn't provide typings so here they are

export interface VoskModel {
  free(): void
  getHandle(): any
}

export interface VoskRecognizer {
  free(): void
  acceptWaveform(data: any): boolean
  result(): any
  partialResult(): void
  finalResult(rec: VoskRecognizer): any
}
