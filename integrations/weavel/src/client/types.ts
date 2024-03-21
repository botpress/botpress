export type CaptureTrackEventRequest = {
  user_id: string
  name: string
  properties?: Record<string, any>
  timestamp?: string
}

export type CaptureTraceDataRequest = {
  user_id: string
  trace_id: string
  role: 'user' | 'assistant'
  content: string
  unit_name?: string
  metadata?: Record<string, any>
  timestamp?: string
}

export type OpenTraceRequest = {
  user_id: string
  trace_id: string
  metadata?: Record<string, any>
  timestamp?: string
}
