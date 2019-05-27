import _ from 'lodash'

import { getAllMatchingForRegex } from '../util'

export default class Parser {
  extractLabelsFromCanonical(canonicalUtterance, intentEntities) {
    const labels = []
    let plainText = ''

    const regex = /\[(.+?)]\((.+?)\)/g
    let m
    let i = 0

    // TODO use getAllMatchingForRegex(regex) instead of this do while
    do {
      m = regex.exec(canonicalUtterance)
      if (m) {
        plainText += canonicalUtterance.substr(i, m.index - i)
        i = m.index + m[0].length
        plainText += m[1]
        labels.push({
          start: plainText.length - m[1].length,
          end: plainText.length - 1,
          entityName: m[2],
          type: _.get(_.find(intentEntities, { name: m[2] }), 'type')
        })
      }
    } while (m)

    plainText += canonicalUtterance.substr(i, canonicalUtterance.length - i)

    return {
      text: plainText,
      labels: labels
    }
  }
}
