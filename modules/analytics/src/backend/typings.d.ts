export interface MetricEntry {
  botId: string
  date: string
  channel: string
  metric: string
  subMetric?: string
  value: number
}
