import { isNode } from 'browser-or-node'
import http from 'http'
import https from 'https'

const _100mb = 100 * 1024 * 1024

export const maxBodyLength = _100mb
export const maxContentLength = _100mb
export const httpAgent = isNode ? new http.Agent({ keepAlive: true }) : undefined
export const httpsAgent = isNode ? new https.Agent({ keepAlive: true }) : undefined
