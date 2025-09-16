export const getRequestPayload = <T extends { email: string; customFields?: string }>(
  input: T
): Record<string, any> => {
  const { email, customFields, ...rest } = input
  const parsedCustomFields = customFields ? JSON.parse(customFields) : {}
  return {
    email,
    fields: {
      ...rest,
      ...parsedCustomFields,
    },
  }
}
