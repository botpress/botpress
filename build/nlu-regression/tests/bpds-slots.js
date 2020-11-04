const problemMaker = (bitfan) => (topic) => {
  return {
    name: `bpds slot ${topic}`,
    type: "slot",
    trainSet: bitfan.datasets.bpds.slots.train[topic],
    testSet: bitfan.datasets.bpds.slots.test[topic],
    lang: "en",
  };
};

module.exports = function(bitfan) {

  const avgStrictSlotAccuray = bitfan.metrics.averageScore(bitfan.criterias.slotsAre)
  const avgLooseSlotAccuray = bitfan.metrics.averageScore(bitfan.criterias.slotIncludes)
  const avgSlotCountAccuray = bitfan.metrics.averageScore(bitfan.criterias.slotCountIs)

  const metrics = [
    avgStrictSlotAccuray,
    avgLooseSlotAccuray,
    avgSlotCountAccuray
  ]

  return {
    name: "bpds-slots",
    
    computePerformance: async function() {
      const allTopics = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
      ];
  
      const makeProblem = problemMaker(bitfan)
      const problems = allTopics.map(makeProblem);
  
      const stanEndpoint = "http://localhost:3200";
      const password = "123456";
      const engine = bitfan.engines.makeBpSlotEngine(stanEndpoint, password);
  
      const solution = {
        name: "bpds slot",
        problems,
        engine,
        metrics,
      };
  
      const seeds = [42];
      const results = await bitfan.runSolution(solution, seeds);
  
      const report = bitfan.evaluateMetrics(results, metrics);
      bitfan.visualisation.showReport(report);
      // bitfan.visualisation.showSlotsResults(results);
  
      return report
    },

    evaluatePerformance: function(currentPerformance, previousPerformance) {
      const toleranceByMetric = {
        [avgStrictSlotAccuray.name]: 0.02,
        [avgLooseSlotAccuray.name]: 0.02,
        [avgSlotCountAccuray.name]: 0.02
      }
      return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
    }
  }
}
