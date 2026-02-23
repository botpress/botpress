export const useBooleanGenerator = (truthyPercentage: number): (() => boolean) => {
  if (truthyPercentage <= 0 || truthyPercentage > 100 || Number.isNaN(truthyPercentage)) {
    throw new Error('Percentage must be a number between 0 and 100 (exclusive of 0)')
  }

  if (truthyPercentage === 100) {
    return () => true
  }

  const probability = truthyPercentage / 100
  return () => Math.random() <= probability
}
