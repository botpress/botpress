export const useBooleanGenerator = (truthyPercentage: number): (() => boolean) => {
  if (truthyPercentage <= 0 || truthyPercentage > 100 || Number.isNaN(truthyPercentage)) {
    throw new Error('Percentage must be an integer between 1 and 100')
  }

  if (truthyPercentage === 100) {
    return () => true
  }

  const probability = truthyPercentage / 100
  return () => Math.random() <= probability
}
