import { SDK } from '.'
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

  router.get('/custom_metrics', async (req, res) => {
    const metrics = await bp.analytics.custom.getAll(req.query.from, req.query.to)
    res.send(metrics)
  })
}
