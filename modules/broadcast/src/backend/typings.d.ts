export interface Broadcast {
  userId: string
  platform: string
  text: string
  type: string
  scheduleId: number
  filters: string
  sendTime: Date
  scheduleUser: string
}

export interface Schedule {
  id?: number
  botId: string
  date: Date
  time: string
  timezone: string
  content: string
  type: string
  filters: string
}

export interface ScheduleRow {
  id?: number
  botId: string
  date_time: string
  ts?: any
  text: string
  type: string
  outboxed: boolean
  errored: boolean
  total_count: number
  sent_count: number
  created_on: any
  filters: string
}
