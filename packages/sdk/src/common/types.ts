import * as typeUtils from '../utils/type-utils'

// TODO: find a way to make ToTags evaluate to Record<string, never> when TTags is never

export type ToTags<TTags extends string | number | symbol> = typeUtils.Cast<
  Partial<Record<TTags, string>>,
  Record<string, string>
>
