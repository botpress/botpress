const axios = require('axios')

/**
 * Decrement the value of a metric
 * @title Decrement Metric
 * @category Analytics
 * @param metric The name of the metric
 * @param value The value of the metric
 * @params
 */
const decrement = async (metric, value, count) => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  await axios.post('/mod/analytics/custom_metrics/decrement', { name: `${metric}~${value}`, count }, axiosConfig)
}

return decrement(args.metric, args.value, args.count)
