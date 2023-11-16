export const INTEGRATION_NAME = 'whatsapp'

export const PhoneNumberIdTag = 'phoneNumberId'
export const UserPhoneTag = 'userPhone'
export const TemplateNameTag = 'templateName'
export const TemplateLanguageTag = 'templateLanguage'
export const TemplateVariablesTag = 'templateVariables'

export const phoneNumberIdTag = `${INTEGRATION_NAME}:${PhoneNumberIdTag}` as const
export const userPhoneTag = `${INTEGRATION_NAME}:${UserPhoneTag}` as const
export const templateNameTag = `${INTEGRATION_NAME}:${TemplateNameTag}` as const
export const templateLanguageTag = `${INTEGRATION_NAME}:${TemplateLanguageTag}` as const
export const templateVariablesTag = `${INTEGRATION_NAME}:${TemplateVariablesTag}` as const
