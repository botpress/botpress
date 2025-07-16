import * as utils from '../../utils/type-utils'

export type ToTags<TTags extends string | number | symbol> = utils.Cast<
  Partial<Record<TTags, string>>,
  Record<string, string>
>
