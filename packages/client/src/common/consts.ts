import { isNode } from 'browser-or-node'
import http from 'http'
import https from 'https'

const _100mb = 100 * 1024 * 1024

export const maxBodyLength = _100mb
export const maxContentLength = _100mb
export const httpAgent = isNode && http && http.Agent ? new http.Agent({ keepAlive: true }) : undefined
export const httpsAgent = isNode && https && https.Agent ? new https.Agent({ keepAlive: true }) : undefined
