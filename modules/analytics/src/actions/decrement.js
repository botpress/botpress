const axios = require('axios')

/**
 * Decrement a metric
 * @title Decrement Metric
 * @category Analytics
 * @param metric The name of the metric
 * @param value The value of the metric
 * @param increment The optional increment of the metric. Default is 1.
 */
const decrement = async (metric, value, increment = 1) => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  await axios.post(
    '/mod/analytics/custom_metrics/decrement',
    { name: `${metric}~${value}`, count: increment },
    axiosConfig
  )
}

return decrement(args.metric, args.value, args.count)
