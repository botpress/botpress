import { getWasmTokenizer } from '@bpinternal/thicktoken/micro'

type TruncateMode = 'head' | 'tail' | 'middle'
type CountOptions = {
  approximate?: boolean
}

export type TextTokenizer = {
  count(text: string, options?: CountOptions): number
  truncate(text: string, maxTokens: number, mode?: TruncateMode): string
  split(text: string): string[]
}

let tokenizer: TextTokenizer | null = null

export async function getTokenizer(): Promise<TextTokenizer> {
  if (!tokenizer) {
    try {
      tokenizer = await getWasmTokenizer()
    } catch (err) {
      throw new Error('Failed to initialize ThickToken tokenizer', { cause: err })
    }
  }
  return tokenizer
}
