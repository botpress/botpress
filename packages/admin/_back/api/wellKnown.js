import nanoid from 'nanoid'
import fs from 'fs'
import path from 'path'

import { Router } from 'express'

const { pem2jwk, jwk2pem } = require('pem-jwk')

export default ({ config, db }) => {
  const router = Router()

  router.get('/public.key', async (req, res) => {
    const publicKey = path.resolve('./keys/jwt.key.pub')
    const content = fs.readFileSync(publicKey)

    res.set('Content-Type', 'text/plain')
    res.send(content)
  })

  router.get('/jwks.json', async (req, res) => {
    const publicKey = path.resolve('./keys/jwt.key.pub')
    const content = fs.readFileSync(publicKey)
    const key2 = pem2jwk(content)
    res.send({ keys: [{ ...key2, use: 'sig', alg: 'RS256', kid: process.env.AUTH0_JWKS_KID }] })
  })

  return router
}
