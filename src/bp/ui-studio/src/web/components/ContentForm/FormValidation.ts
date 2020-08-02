import { lang } from 'botpress/shared'

const isValidBraces = (str) => {
  let depth = 0
  const arr = str.split('')
  for (let i = 0; i < arr.length - 1; i++) {
    const value = str[i] + str[i + 1]
    if (value == '{{') {
      depth ++
    } else if (value == '}}') {
      depth --
    }
    if (depth < 0) { return false }
  }
  if (depth > 0) { return false }
  return true
}

const validateBraces = (formData, errors) => {
  const properties = Object.keys(formData)
  for (const property of properties) {
    const value = formData[property]
    if (typeof value === 'string' && value.includes('{{')) {
      if (!isValidBraces(value)) {
        errors[property].addError(lang.tr('contentForm.invalidBraces'))
      }
    } else if (Array.isArray(value)) {
      value.forEach( (entry, index) => {
        const subProperties = Object.keys(entry)
        for (const subProperty of subProperties) {
          const subValue = entry[subProperty]
          if (typeof subValue === 'string' && subValue.includes('{{') && !isValidBraces(subValue)) {
            errors[property][index][subProperty].addError(lang.tr('contentForm.invalidBraces'))
          }
        }
      })
    }
  }
  return errors
}

export const validateForm = (formData, errors) => {
  errors = validateBraces(formData, errors)
  return errors
}
