import crypto from 'crypto'
import nanoid from 'nanoid'

const RANDOM_SECRET_KEY_LENGTH = 32
const IV_LENGTH = 16

export default class Crypto {
  constructor({ botfile }) {
    this.algorithm = 'aes-256-cbc'
    this.secretKey = botfile.secretKey || nanoid(RANDOM_SECRET_KEY_LENGTH)
  }

  encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(this.secretKey), iv)

    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  decrypt(text) {
    const textParts = text.split(':')
    const iv = new Buffer(textParts.shift(), 'hex')
    const encryptedText = new Buffer(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(this.secretKey), iv)

    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString()
  }
}
