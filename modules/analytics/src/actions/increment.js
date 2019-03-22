const axios = require('axios')

/**
 * Increment the value of a metric
 * @title Increment Metric
 * @category Analytics
 * @param name The name of the metric
 * @param value The value of the metric
 * @param count The increment of the metric
 */
const increment = async (name, value, count = 1) => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  await axios.post('/mod/analytics/custom_metrics/increment', { name: `${name}~${value}`, count }, axiosConfig)
}

return increment(args.name, args.value, args.count)
