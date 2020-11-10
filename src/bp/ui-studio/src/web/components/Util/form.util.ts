export const isMissingCurlyBraceClosure = (text: string): boolean => {
  const brackets = text?.match(/{{{?|}}}?/g)

  return brackets && !(brackets.length % 2 === 0 &&
    new Array(brackets.length / 2)
      .fill([])
      .map( () => brackets.splice(0, 2))
      .map( bracket =>
        bracket[0].match(/{{{?/g) &&
        bracket[1].match(/}}}?/g) &&
        bracket[0].length === bracket[1].length
      )
      .reduce((a, c) => c && a))
}
