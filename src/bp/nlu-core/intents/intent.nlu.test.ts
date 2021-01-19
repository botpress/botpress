import bitfan from '@botpress/bitfan'

export default {
  name: 'bpds-intent',
  computePerformance: async () => {
    return bitfan.evaluateMetrics([], [])
  },
  evaluatePerformance: async (
    currentPerformance: bitfan.PerformanceReport,
    previousPerformance: bitfan.PerformanceReport
  ) => {
    return bitfan.comparePerformances(currentPerformance, previousPerformance)
  }
}
