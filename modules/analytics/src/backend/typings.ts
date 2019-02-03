import Analytics from './analytics'

export type AnalyticsByBot = { [botId: string]: Analytics }

export type CustomAnalytics = {
  getAll: Function
  addGraph: Function
  increment: Function
  decrement: Function
  set: Function
}
