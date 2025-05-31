import Zai from '@botpress/zai'

export const withRetry = (zai: Zai.Zai) => {
  const methods: (keyof Zai.Zai)[] = ['check', 'extract', 'filter', 'label', 'learn', 'rewrite', 'summarize', 'text']

  return methods.reduce<Zai.Zai>((acc, key) => {
    const original = zai[key]
    if (typeof original === 'function') {
      const retryable = async (...args: any[]) => {
        const maxAttempts = 10
        let attempt = 0
        let lastError

        while (attempt < maxAttempts) {
          try {
            return await (original as any).bind(zai)(...args)
          } catch (err) {
            lastError = err
            attempt++
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 250 * 2 ** attempt))
            }
          }
        }

        throw lastError
      }

      acc[key] = retryable as any
    }
    return acc
  }, {} as Zai.Zai)
}
