import express from 'express'

const app = express()

app.use(express.static('../static'))

app.get('/', (req, res) => {
  res.contentType('text/javascript')
  res.sendFile('./static/channel-web.js', { root: __dirname })
})

app.get('/register', (req, res) => {
  res.contentType('text/plain')
  res.sendStatus(200)
})

export default app
