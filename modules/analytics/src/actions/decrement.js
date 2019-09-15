const axios = require('axios')

/**
 * Decrements the value of a specific metric group.
 *
 * The group (optional) is useful when you need to compute a graph taking into account multiple variables.
 * For example, you could count the gender ratio by incrementing:
 *
 * Male -> `metric = gender` and `group = male`
 *
 * Female -> `metric = gender` and `group = female`
 *
 * @title Decrement Metric
 * @category Analytics
 * @param {string} metric The name of the metric
 * @param {string} [group=all] Optional group inside the metrics
 * @param {Number} [increment=1] The optional increment of the metric
 */
const decrement = async (metric, group, increment = 1) => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  await axios.post(
    '/mod/analytics/custom_metrics/decrement',
    { name: `${metric}~${group}`, count: increment },
    axiosConfig
  )
}

return decrement(args.metric, args.group, args.count)
