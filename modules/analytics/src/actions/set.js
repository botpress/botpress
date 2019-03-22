const axios = require('axios')

/**
 * Set a custom metric value
 * @title Set Custom Metric
 * @category Analytics
 * @param metric The name of the metric
 * @param value The value of the metric
 * @param count The optional count number to set. Defaults to 1.
 */
const set = async (metric, value, count = 1) => {
  console.log('count', count)
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  await axios.post(
    '/mod/analytics/custom_metrics/set',
    { name: `${metric}~${value}`, count: Number(count) },
    axiosConfig
  )
}

return set(args.metric, args.value, args.count)
