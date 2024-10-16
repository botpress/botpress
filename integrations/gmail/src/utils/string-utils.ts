export const encodeBase64URL = (str: string | Buffer) => Buffer.from(str).toString('base64url')

export const decodeBase64URL = (str: string) => Buffer.from(str, 'base64url').toString()
