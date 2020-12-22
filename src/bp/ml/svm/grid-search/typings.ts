import { Report, SvmParameters } from '../typings'

export interface GridSearchResult {
  params: SvmParameters
  report?: Report
}

export interface GridSearchProgress {
  done: number
  total: number
}
