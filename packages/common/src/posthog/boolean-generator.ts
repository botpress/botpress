export const useBooleanGenerator = (truthyRatio: number): (() => boolean) => {
  if (truthyRatio <= 0 || truthyRatio > 1 || Number.isNaN(truthyRatio)) {
    throw new Error('Percentage must be a number between 0 and 1 (exclusive of 0)')
  }

  if (truthyRatio === 1) {
    return () => true
  }

  const probability = truthyRatio
  return () => Math.random() <= probability
}
