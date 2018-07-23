import express from 'express'
import proxy from 'express-http-proxy'

const app = express()
const basePath = '/api/v1'

// TODO: Extract in shared module
const httpProxy = (originPath: string, targetPath: string, targetHost: string) => {
  app.use(
    originPath,
    proxy(targetHost, {
      proxyReqPathResolver: (req: any, res: any) => new Promise((resolve, reject) => resolve(targetPath))
    })
  )
}

httpProxy(basePath + '/modules/channel-web', '/', 'http://localhost:3003')

app.get(basePath + '/modules', (req, res) => {
  res.send(
    '[{"name":"audience","fullName":"@botpress/audience","homepage":"https://github.com/botpress/modules","menuText":"Audience","menuIcon":"people","noInterface":false,"moduleView":{"stretched":false},"plugins":[]},{"name":"nlu","fullName":"@botpress/nlu","homepage":"https://github.com/botpress/modules","menuText":"NLU","menuIcon":"fiber_smart_record","noInterface":false,"moduleView":{"stretched":true},"plugins":[]},{"name":"skill-choice","fullName":"@botpress/skill-choice","homepage":"https://github.com/botpress/modules","menuText":"Choice","menuIcon":"view_module","noInterface":true,"moduleView":{"stretched":false},"plugins":[]},{"name":"hitl","fullName":"@botpress/hitl","homepage":"https://github.com/botpress/modules","menuText":"HITL","menuIcon":"feedback","noInterface":false,"moduleView":{"stretched":false},"plugins":[]},{"name":"channel-web","fullName":"@botpress/channel-web","homepage":"https://github.com/botpress/modules","menuText":"Web Chat","menuIcon":"chrome_reader_mode","noInterface":true,"moduleView":{"stretched":false},"plugins":[{"entry":"WebBotpressUIInjection","position":"overlay"}]}]'
  )
})

app.get(
  basePath + '/bot/information',
  (req, res) =>
    '{"name":"botpress-angular","version":"1.0.0","description":"<no description>","author":"Botpress","license":"AGPL-3.0"}'
)

export default app
