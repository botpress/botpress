import { runtimeApi, adminApi, filesApi, tablesApi, api as publicApi, billingApi } from '@botpress/api'
import * as fs from 'fs'
import * as path from 'path'

const options = {
  generator: 'opapi',
  ignoreDefaultParameters: true,
  ignoreSecurity: true,
} as const

// TEMPORARY: the version of opapi bundled in the current @botpress/api still
// emits axios-based clients. This rewrites the generated code into the exact
// output of the fixed opapi generator (transport-agnostic, no axios import).
// It becomes a no-op once @botpress/api ships an opapi that no longer emits
// axios code, at which point it can be deleted.
const deaxiosify = (dir: string): void => {
  const toAxiosFile = path.join(dir, 'to-axios.ts')
  if (!fs.existsSync(toAxiosFile)) {
    return // already generated without axios
  }

  const indexFile = path.join(dir, 'index.ts')
  fs.writeFileSync(
    indexFile,
    fs
      .readFileSync(indexFile, 'utf-8')
      .replace("import axios, { AxiosInstance } from 'axios'\n", '')
      .replace(
        "import { toAxiosRequest } from './to-axios'",
        "import { toRequest, type RequestConfig } from './to-request'"
      )
      .replace(
        'export type ClientProps = {',
        [
          'export type HttpResponse<T> = {',
          '  data: T',
          '}',
          '',
          '/**',
          ' * Minimal http transport the generated client depends on. Implementations',
          ' * MUST reject (throw) on unsuccessful http statuses — exposing the parsed',
          ' * error body under `response.data` on the thrown error so it can be mapped',
          ' * to an api error — and resolve with the parsed response body under `data`.',
          ' */',
          'export type HttpClient = {',
          '  request: <T>(config: RequestConfig) => Promise<HttpResponse<T>>',
          '}',
          '',
          'export type ClientProps = {',
        ].join('\n')
      )
      .replaceAll('toAxiosRequest', 'toRequest')
      .replaceAll('AxiosInstance', 'HttpClient')
      .replaceAll('axiosInstance', 'httpClient')
      .replaceAll('axiosReq', 'httpReq')
      .replace(
        [
          '// maps axios error to api error type',
          'function toApiError(err: unknown): Error {',
          '  if (axios.isAxiosError(err) && err.response?.data) {',
          '    return errorFrom(err.response.data)',
          '  }',
          '  return errorFrom(err)',
          '}',
        ].join('\n'),
        [
          '// maps http error to api error type',
          'function toApiError(err: unknown): Error {',
          '  const data = (err as { response?: { data?: unknown } } | null)?.response?.data',
          '  if (data) {',
          '    return errorFrom(data)',
          '  }',
          '  return errorFrom(err)',
          '}',
        ].join('\n')
      )
  )

  const toRequestFile = path.join(dir, 'to-request.ts')
  fs.writeFileSync(
    toRequestFile,
    fs
      .readFileSync(toAxiosFile, 'utf-8')
      .replace('import { AxiosRequestConfig } from "axios"\n', '')
      .replace(
        'const isDefined = ',
        [
          'export type RequestConfig = {',
          '  method: string',
          '  url: string',
          '  headers: Record<string, string>',
          '  data?: any',
          '}',
          '',
          'const isDefined = ',
        ].join('\n')
      )
      .replaceAll('toAxiosRequest', 'toRequest')
      .replaceAll('AxiosRequestConfig', 'RequestConfig')
  )
  fs.rmSync(toAxiosFile)
}

// TEMPORARY, same deal as deaxiosify: the fixed opapi generator emits errors.ts
// relying on globalThis.crypto instead of importing the node crypto module.
const denodecryptoify = (dir: string): void => {
  const errorsFile = path.join(dir, 'errors.ts')
  const content = fs.readFileSync(errorsFile, 'utf-8')
  if (!content.includes("import crypto from 'crypto'")) {
    return // already generated without node crypto
  }

  fs.writeFileSync(
    errorsFile,
    content
      .replace("\nimport crypto from 'crypto'\n", '')
      .replace(
        "  // Fallback in case crypto isn't available.",
        '  // Fallback in environments without a web crypto implementation.'
      )
      .replace(
        [
          'let cryptoLib: CryptoLib =',
          "  typeof window !== 'undefined' && typeof window.document !== 'undefined'",
          "    ? window.crypto // Note: On browsers we need to use window.crypto instead of the imported crypto module as the latter is externalized and doesn't have getRandomValues().",
          '    : crypto',
          '',
          'if (!cryptoLib.getRandomValues) {',
          '  // Use a polyfill in older environments that have a crypto implementaton missing getRandomValues()',
          '  cryptoLib = cryptoLibPolyfill',
          '}',
        ].join('\n'),
        [
          '// globalThis.crypto covers browsers, web workers, node >= 19 and most edge runtimes',
          'const cryptoLib: CryptoLib =',
          "  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function'",
          '    ? globalThis.crypto',
          '    : cryptoLibPolyfill',
        ].join('\n')
      )
  )
}

const main = async (): Promise<void> => {
  await publicApi.exportClient('./src/gen/public', { generator: 'opapi' })
  await runtimeApi.exportClient('./src/gen/runtime', options)
  await adminApi.exportClient('./src/gen/admin', options)
  await filesApi.exportClient('./src/gen/files', options)
  await tablesApi.exportClient('./src/gen/tables', options)
  await billingApi.exportClient('./src/gen/billing', options)

  for (const name of ['public', 'runtime', 'admin', 'files', 'tables', 'billing']) {
    deaxiosify(`./src/gen/${name}`)
    denodecryptoify(`./src/gen/${name}`)
  }
}

void main().catch((thrown) => {
  console.error(thrown)
  process.exit(1)
})
