const TAGS_REGEX = /\[\[(.*?)\]\]/gim
const VARIABLES_REGEX = /(\$[^(\s|\$|\{{)]+)/gim
const EVENT_REGEX = /\{\{(.*?)\}\}/gim

export const convertToString = (value: string): string => {
  let matches: any
  let newString = value

  while ((matches = TAGS_REGEX.exec(value)) !== null) {
    const data = JSON.parse(matches[1])
    let suffix = ''

    if (data.prefix === '{{') {
      suffix = '}}'
    }

    const newValue = `${data.prefix}${data.value}${suffix}`

    newString = newString.replace(matches[0], newValue)
  }

  return newString
}

export const convertToTags = (value: string): string => {
  let matches: any
  let newString = value

  while ((matches = VARIABLES_REGEX.exec(value)) !== null) {
    newString = newString.replace(matches[0], `[[{"value": "${matches[0].replace('$', '')}", "prefix": "$$"}]]`)
  }

  while ((matches = EVENT_REGEX.exec(value)) !== null) {
    newString = newString.replace(matches[0], `[[{"value": "${matches[1]}", "prefix": "{{"}]]`)
  }

  return newString
}
