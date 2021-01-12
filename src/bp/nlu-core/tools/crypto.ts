import crypto from 'crypto'

export const HALF_MD5_REG = /^[a-fA-F0-9]{16}$/

const MD5_BITE_SIZE = 16 // 128 / 8
const MD5_NIBBLES_SIZE = MD5_BITE_SIZE * 2

export const halfmd5 = (text: string) => {
  return crypto
    .createHash('md5')
    .update(text)
    .digest('hex')
    .slice(MD5_NIBBLES_SIZE / 2)
}
