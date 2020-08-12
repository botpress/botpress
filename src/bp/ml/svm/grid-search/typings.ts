import { Report, SvmParameters } from '../typings'

export type GridSearchResult = { params: SvmParameters; report?: Report }

export type GridSearchProgress = {
  done: number
  total: number
}
