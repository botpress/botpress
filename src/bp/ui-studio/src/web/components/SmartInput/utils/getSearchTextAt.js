/* @flow */

/**
 * Return tail end of the string matching trigger upto the position.
 */
export default (blockText, position, trigger) => {
  const str = blockText.substr(0, position)
  let begin = trigger.length === 0 ? 0 : str.lastIndexOf(trigger)

  if (str[begin - 1] === trigger) {
    begin--
  }

  const matchingString = trigger.length === 0 ? str : str.slice(begin + trigger.length)
  const end = str.length

  return {
    begin,
    end,
    matchingString
  }
}
