import _ from 'lodash'

export const getFormData = (node, contentLang, defaultLanguage): any => {
  let data = {}

  if (node?.formData) {
    data = getFormDataForLang(node, contentLang)

    if (isFormEmpty(data)) {
      data = getFormDataForLang(node, defaultLanguage)
    }
  }

  return data
}

export const isFormEmpty = formData => {
  return _.every(
    Object.keys(formData).map(x => {
      // Ignore undefined and booleans, since they are set by default
      if (!formData[x] || _.isBoolean(formData[x])) {
        return
      }

      // Ignore array with empty objects (eg: skill choice)
      if (_.isArray(formData[x]) && !formData[x].filter(_.isEmpty).length) {
        return
      }

      return formData[x]
    }),
    _.isEmpty
  )
}

const getFormDataForLang = (contentItem: any, language: string) => {
  const { formData, contentType } = contentItem
  const languageKeys = Object.keys(formData).filter(x => x.includes('$' + language))

  const data: any = languageKeys.reduce((obj, key) => {
    obj[key.replace('$' + language, '')] = formData[key]
    return obj
  }, {})

  return { ...data, contentType }
}
