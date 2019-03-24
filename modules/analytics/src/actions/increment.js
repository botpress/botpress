const axios = require('axios')

/**
 * Increment a metric
 * @title Increment Metric
 * @category Analytics
 * @param name The name of the metric
 * @param value The value of the metric
 * @param increment The optional increment of the metric. Default is 1.
 */
const increment = async (name, value, increment = 1) => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  await axios.post(
    '/mod/analytics/custom_metrics/increment',
    { name: `${name}~${value}`, count: increment },
    axiosConfig
  )
}

return increment(args.name, args.value, args.count)
