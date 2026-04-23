import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

export const registry = new Registry()

collectDefaultMetrics({ register: registry })

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status_code', 'path'],
  registers: [registry],
})

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status_code', 'path'],
  buckets: [0.05, 0.1, 0.5, 1, 3, 10, 60, 120],
  registers: [registry],
})
