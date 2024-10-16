import { RuntimeError } from '@botpress/sdk'
import { getServices, Services } from './services/servicesContainer'
import { IntegrationProps } from '.botpress'

export const keepOnlySetProperties = (obj: object) => Object.fromEntries(Object.entries(obj).filter(([, v]) => !!v))

export const canonicalize = (identifier: string) => identifier.trim().toUpperCase().normalize()

export const nameCompare = (name1: string, name2: string) => canonicalize(name1) === canonicalize(name2)

export const createCsvRegex = (expression: RegExp, separators = ',; ') =>
  new RegExp(`^(?:${expression.source}(?:[${separators}]+|$))+$`)

export const extractFromCsv = (csv: string, separators = ',; ') =>
  csv
    .split(new RegExp(`[${separators}]+`))
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

type Actions = {
  [K in keyof IntegrationProps['actions']]: IntegrationProps['actions'][K]
}
type ActionWithServices = {
  [K in keyof Actions]: (props: Parameters<Actions[K]>[0], dependencies: Services) => ReturnType<Actions[K]>
}

const tryCatch = async <T>(fn: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    throw new RuntimeError(`${errorMessage}: ${error}`, error as Error)
  }
}

export const wrapActionAndInjectServices = <K extends keyof Actions>({
  action,
  errorMessage,
}: {
  action: ActionWithServices[K]
  errorMessage: string
}): Actions[K] =>
  (async (props: Parameters<Actions[K]>[0]) => {
    const services = getServices(props.ctx)
    return tryCatch(() => action(props, services), errorMessage)
  }) as unknown as Actions[K]
