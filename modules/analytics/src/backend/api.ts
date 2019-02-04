import { SDK } from 'botpress'

import { AnalyticsByBot } from './typings'

export default async (bp: SDK, analytics: AnalyticsByBot) => {
  const router = bp.http.createRouterForBot('analytics')

  router.get('/graphs', async (req, res) => {
    const graphData = await analytics[req.params.botId].getChartsGraphData()
    res.send(graphData)
  })

  router.get('/metadata', async (req, res) => {
    const metadata = await analytics[req.params.botId].getAnalyticsMetadata()
    res.send(metadata)
  })

  router.post('/graphs', async (req, res) => {
    const fn = req.body.fn ? { fn: eval(req.body.fn) } : {}
    const fnAvg = req.body.fnAvg ? { fnAvg: eval(req.body.fnAvg) } : {}
    analytics[req.params.botId].custom.addGraph({ ...req.body, ...fn, ...fnAvg })
    res.end()
  })

  router.get('/custom_metrics', async (req, res) => {
    const metrics = await analytics[req.params.botId].custom.getAll(req.query.from, req.query.to)
    res.send(metrics)
  })

  const methods = ['increment', 'decrement', 'set']
  methods.map(method => {
    router.post(`/custom_metrics/${method}`, async (req, res) => {
      const params = [req.body.name, ...(typeof req.body.count === 'number' ? [req.body.count] : [])]
      analytics[req.params.botId].custom[method](...params)
      res.end()
    })
  })
}
