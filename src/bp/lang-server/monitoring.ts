import ms from 'ms'
import onHeaders from 'on-headers'

const debugMonitor = DEBUG('api:monitoring')

let metricCollectionEnabled = false
let metricsContainer = {}

export const startMonitoring = () => {
  console.log('Metrics collection enabled. Interval: ', process.env.MONITORING_INTERVAL)

  setInterval(() => {
    debugMonitor('Stats %o', metricsContainer)
    metricsContainer = {}
  }, ms(process.env.MONITORING_INTERVAL!))

  metricCollectionEnabled = true
}

export const incrementMetric = (language: string, metricName: string, value?: number | undefined) => {
  if (!metricCollectionEnabled) {
    return
  }

  const key = `${language || 'none'}_${metricName}`
  const realValue = value !== undefined ? value : 1

  if (!metricsContainer[key]) {
    metricsContainer[key] = realValue
  } else {
    metricsContainer[key] += realValue
  }
}

export const monitoringMiddleware = (req, res, next) => {
  const startAt = Date.now()

  onHeaders(res, () => {
    const timeInMs = Date.now() - startAt
    incrementMetric(req.body.lang, 'requestCount')
    incrementMetric(req.body.lang, 'latencySum', timeInMs)
    res.setHeader('X-Response-Time', `${timeInMs}ms`)
  })

  next()
}
