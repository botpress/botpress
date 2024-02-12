import * as bp from '.botpress'

type ValueOf<T> = T[keyof T]

export type ActionArgs = Parameters<ValueOf<bp.IntegrationProps['actions']>>[0]
