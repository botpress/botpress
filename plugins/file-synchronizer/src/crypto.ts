export const randomUUID = async (): Promise<string> => {
  const crypto = await _getWebCrypto()
  return crypto.randomUUID()
}

type _WebCrypto = { randomUUID: () => string }
let _webCrypto: _WebCrypto | undefined

export const _getWebCrypto = async (): Promise<_WebCrypto> => {
  if (!_webCrypto) {
    if (typeof (globalThis as any).crypto?.randomUUID === 'function') {
      _webCrypto = (globalThis as any).crypto
    } else if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const nodeCrypto = await import('crypto')
        _webCrypto = nodeCrypto.webcrypto
      } catch (thrown: unknown) {
        const error: Error = thrown instanceof Error ? thrown : new Error(String(thrown))
        throw new Error(`Failed to import 'crypto' module: ${error.message}`)
      }
    }

    if (!_webCrypto || typeof _webCrypto.randomUUID !== 'function') {
      throw new Error('No suitable web crypto implementation available')
    }
  }
  return _webCrypto
}
