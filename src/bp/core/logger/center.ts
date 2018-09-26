import _ from 'lodash'

export default (text, width) => {
  var padding = Math.floor((width - text.length) / 2)
  return _.repeat(' ', padding) + text + _.repeat(' ', padding)
}
