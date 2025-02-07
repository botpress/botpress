import * as utils from '../../utils/type-utils'

type AsTags<T extends Record<string, string | undefined>> = utils.Cast<T, Record<string, string>>
export type ToTags<TTags extends string | number | symbol> = AsTags<Partial<Record<utils.Cast<TTags, string>, string>>>
