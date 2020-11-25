const problemMaker = (bitfan) => async (name, trainSet, testSet) => {

  const fileDef = {
    lang: "en",
    fileType: "dataset",
    type: "intent",
    namespace: ""
  }
  const trainFileDef = { name: trainSet, ...fileDef }
  const testFileDef = { name: testSet, ...fileDef }

  return {
    name,
    type: "intent",
    trainSet: await bitfan.datasets.readDataset(trainFileDef),
    testSet: await bitfan.datasets.readDataset(testFileDef),
    lang: "en",
  };
};


module.exports = function(bitfan) {

  const metrics = [
    bitfan.metrics.accuracy,
    bitfan.metrics.oosAccuracy,
    bitfan.metrics.oosPrecision,
    bitfan.metrics.oosRecall,
    bitfan.metrics.oosF1,
  ];

  return {
    name: "clinc150",

    computePerformance: async function() {
      const stanEndpoint = "http://localhost:3200";
      const password = "123456";
      const engine = bitfan.engines.makeBpIntentEngine(stanEndpoint, password);

      const makeProblem = problemMaker(bitfan)

      const results = await bitfan.runSolution({
        name: "bpds intent",
        problems: [await makeProblem("clinc150, 20 utt/intent, seed 42", "clinc150_20_42-train", "clinc150_100-test")],
        engine,
      }, [42]);

      const performanceReport = bitfan.evaluateMetrics(results, metrics);
      await bitfan.visualisation.showPerformanceReport(performanceReport, { groupBy: "problem" });
      await bitfan.visualisation.showOOSConfusion(results);
  
      return performanceReport
    },

    evaluatePerformance: function(currentPerformance, previousPerformance) {
      const toleranceByMetric = {
        [bitfan.metrics.accuracy.name]: 0.05,
        [bitfan.metrics.oosAccuracy.name]: 0.05,
        [bitfan.metrics.oosPrecision.name]: 0.1,
        [bitfan.metrics.oosRecall.name]: 0.1,
        [bitfan.metrics.oosF1.name]: 0.15, // more tolerance for f1 score
      }
      return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
    }
  }
}
