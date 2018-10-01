import { SDK } from '.'

export default async (bp: SDK, analytics) => {
  const router = bp.http.createRouterForBot('analytics')

  router.get('/graphs', (req, res, next) => {
    res.send(analytics.getChartsGraphData())
  })

  router.get('/metadata', (req, res, next) => {
    analytics.getAnalyticsMetadata().then(metadata => res.send(metadata))
  })

  router.get('/custom_metrics', async (req, res, next) => {
    const metrics = await bp.analytics.custom.getAll(req.query.from, req.query.to)
    res.send(metrics)
  })
}
