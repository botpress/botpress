const TAGS_REGEX = /\[\[(.*?)\]\]/gim
const VARIABLES_REGEX = /(\$[^(\s|\$|\{{|"|')]+)/gim
const EVENT_REGEX = /\{\{(.*?)\}\}/gim

export const convertToString = (value: string): string => {
  let matches: any
  // replaces special characters representing a space from the tagify library by a space
  let newString = value.split(String.fromCharCode(160)).join(' ')

  while ((matches = TAGS_REGEX.exec(value)) !== null) {
    const tag = matches[0]
    const data = JSON.parse(matches[1])
    let suffix = ''

    if (data.prefix === '{{') {
      suffix = '}}'
    }

    const index = newString.indexOf(tag) + tag.length
    const string = newString.substring(index)
    if (![' ', '"', "'"].includes(string[0]) && index !== newString.length) {
      suffix += ' '
    }
    const newValue = `${data.prefix}${data.value}${suffix}`

    newString = newString.replace(tag, newValue)
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

export const convertToHtml = (value: string): string => {
  let matches: any
  let newString = value

  while ((matches = VARIABLES_REGEX.exec(value)) !== null) {
    newString = newString.replace(matches[0], `<span class="variable">$${matches[0].replace('$', '')}</span>`)
  }

  while ((matches = EVENT_REGEX.exec(value)) !== null) {
    newString = newString.replace(matches[0], `<span class="variable">{{${matches[1]}}}</span>`)
  }

  return newString
}
