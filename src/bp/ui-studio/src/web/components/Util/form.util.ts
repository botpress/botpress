export const isMissingCurlyBraceClosure = (text: string): boolean => {
  const brackets = text?.match(/{{{?|}}}?/g)

  return (
    brackets &&
    !(
      brackets.length % 2 === 0 &&
      new Array(brackets.length / 2)
        .fill('')
        .map(() => {
          const [leftBracket, rightBracket] = brackets.splice(0, 2)
          return leftBracket.match(/{{{?/g) && rightBracket.match(/}}}?/g) && leftBracket.length === rightBracket.length
        })
        .reduce((a, c) => c && a)
    )
  )
}
