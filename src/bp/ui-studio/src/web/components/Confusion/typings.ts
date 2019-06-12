export interface NluStatus {
  f1score: number
  synced: boolean
  computing: boolean
}

export interface MatrixInfo {
  matrix: any
  confusionComputing: boolean
}

export interface NluStatusProps {
  updateNluStatus: (s: NluStatus) => void
  synced: boolean
}
