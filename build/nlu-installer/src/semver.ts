export const dotsToUnderscores = (dots: string) => {
  const [major, minor, patch] = dots.split('.')
  return `${major}_${minor}_${patch}`
}

export const underscoresToDots = (underscores: string) => {
  const [major, minor, patch] = underscores.split('_')
  return `${major}.${minor}.${patch}`
}
