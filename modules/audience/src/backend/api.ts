import { SDK } from '.'

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('audience')

  // TODO add sdk service for users listing and access
  router.post('/users', (req, res) => {
    const { from, limit } = req.body
    bp.users
      .list(limit, from)
      .then(values => {
        res.send(values)
      })
      .catch(err => res.status(500).send({ message: err.message }))
  })

  router.get('/users/count', (req, res) => {
    bp.users
      .count()
      .then(count => {
        res.send(count.toString())
      })
      .catch(err => res.status(500).send({ message: err.message }))
  })
}
