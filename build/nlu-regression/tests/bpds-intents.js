const problemMaker = (bitfan) => (topic) => {
  return {
    name: `bpds intents ${topic}`,
    type: "intent",
    trainSet: bitfan.datasets.bpds.intents.train[topic],
    testSet: bitfan.datasets.bpds.intents.test[topic],
    lang: "en",
  };
};


module.exports = function(bitfan) {

  const avgIntentAccurancy = bitfan.metrics.averageScore(bitfan.criterias.labelIs)
  const metrics = [
    avgIntentAccurancy,
    bitfan.metrics.oosAccuracy,
    bitfan.metrics.oosPrecision,
    bitfan.metrics.oosRecall,
    bitfan.metrics.oosF1,
  ];

  return {
    name: "bpds-intent",

    computePerformance: async function() {
      const allTopics = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ];
  
      const makeProblem = problemMaker(bitfan)
      const problems = allTopics.map(makeProblem);
  
      const stanEndpoint = "http://localhost:3200";
      const password = "123456";
      const engine = bitfan.engines.makeBpIntentEngine(stanEndpoint, password);
  
      const solution = {
        name: "bpds intent",
        problems,
        engine,
        metrics,
      };
  
      const seeds = [42, 69, 666];
      const results = await bitfan.runSolution(solution, seeds);
  
      const reportBySeed = bitfan.evaluateMetrics(results, metrics, { groupBy: "seed" });
      const reportByProblem = bitfan.evaluateMetrics(results, metrics, { groupBy: "problem" });
  
      await bitfan.visualisation.showReport(reportBySeed);
      await bitfan.visualisation.showReport(reportByProblem);
      await bitfan.visualisation.showOOSConfusion(results);
  
      return reportBySeed
    },

    evaluatePerformance: function(currentPerformance, previousPerformance) {
      const toleranceByMetric = {
        [avgIntentAccurancy.name]: 0.02,
        [bitfan.metrics.oosAccuracy.name]: 0.05,
        [bitfan.metrics.oosPrecision.name]: 0.05,
        [bitfan.metrics.oosRecall.name]: 0.05,
        [bitfan.metrics.oosF1.name]: 0.15, // more tolerance for f1 score
      }
      return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
    }
  }
}
