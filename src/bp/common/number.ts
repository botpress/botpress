export const closest = (arr: number[], value: number) => {
  return arr.reduce((prev, curr) => {
    const diffPref = Math.abs(prev - value)
    const diffCurr = Math.abs(curr - value)

    if (diffPref === diffCurr) {
      return prev > curr ? prev : curr
    } else {
      return diffCurr < diffPref ? curr : prev
    }
  })
}
