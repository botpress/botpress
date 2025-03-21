import * as sdk from '@botpress/sdk'

export const randomUUID = async (): Promise<string> => {
  const crypto = await _getWebCrypto()
  return crypto.randomUUID()
}

type _WebCrypto = { randomUUID: () => string }
let _webCrypto: _WebCrypto | undefined

export const _getWebCrypto = async (): Promise<_WebCrypto> => {
  if (!_webCrypto) {
    if (Reflect.has(globalThis, 'crypto')) {
      const browserCrypto = Reflect.get(globalThis, 'crypto')
      if (Reflect.has(browserCrypto, 'randomUUID')) {
        _webCrypto = browserCrypto
      }
    } else if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const nodeCrypto = await import('crypto')
        _webCrypto = nodeCrypto.webcrypto
      } catch (e) {
        throw new sdk.RuntimeError(`Failed to import 'crypto' module: ${e}`)
      }
    }

    if (!_webCrypto || typeof _webCrypto.randomUUID !== 'function') {
      throw new sdk.RuntimeError('No suitable web crypto implementation available')
    }
  }
  return _webCrypto
}
