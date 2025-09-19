import { RuntimeError } from '@botpress/client'

export const getRequestPayload = <T extends { email: string; customFields?: string }>(
  input: T
): Record<string, any> => {
  const { email, customFields, ...rest } = input

  let parsedCustomFields = {}
  try {
    parsedCustomFields = customFields ? JSON.parse(customFields) : {}
  } catch (e) {
    throw new RuntimeError('Parsing JSON failed with error ', e instanceof Error ? e : undefined)
  }
  return {
    email,
    fields: {
      ...rest,
      ...parsedCustomFields,
    },
  }
}
