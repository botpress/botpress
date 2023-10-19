import { Request } from '@botpress/sdk'
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken'
import { JwksClient } from 'jwks-rsa'

const jwksClient = new JwksClient({
  jwksUri: 'https://login.botframework.com/v1/.well-known/keys',
})

const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
  jwksClient.getSigningKey(header.kid, function (err, key) {
    if (key) {
      callback(null, key.getPublicKey())
    } else if (err) {
      callback(err)
    } else {
      callback(new Error('No key found'))
    }
  })
}

export const authorizeRequest = async (req: Request) => {
  const authorization = req.headers.authorization
  const [, token] = authorization?.split(' ') ?? []

  if (!token) {
    throw new Error('No authorization token found')
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, (err, decoded) => {
      if (err) {
        reject(err)
      } else {
        resolve(decoded)
      }
    })
  })
}
