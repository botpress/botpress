import express from 'express'

const app = express()

app.use(express.static('../static'))

app.get('/', (req, res) => {
  res.contentType('text/javascript')
  res.sendFile('./static/channel-web.js', { root: __dirname })
})

export default app
