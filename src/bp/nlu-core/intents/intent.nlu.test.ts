import * as bitfanSDK from '@botpress/bitfan'

export default function(bitfan: typeof bitfanSDK) {
  return {
    name: 'bpds-intent',
    computePerformance: async () => {
      return bitfan.evaluateMetrics([], [])
    },
    evaluatePerformance: async (
      currentPerformance: bitfanSDK.PerformanceReport,
      previousPerformance: bitfanSDK.PerformanceReport
    ) => {
      return bitfan.comparePerformances(currentPerformance, previousPerformance)
    }
  }
}
