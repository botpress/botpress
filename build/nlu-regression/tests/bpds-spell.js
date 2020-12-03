module.exports = function(bitfan) {

  const metrics = [
    bitfan.metrics.accuracy
  ];

  return {
    name: "bpds-spell",

    computePerformance: async function() {
      const stanEndpoint = "http://localhost:3200";
      const password = "123456";
      const engine = bitfan.engines.makeBpSpellEngine(stanEndpoint, password);

      const trainFileDef = { 
        name: "A-train", 
        lang: "en",
        fileType: "document",
        type: "spell",
        namespace: "bpds"
      }

      const testFileDef = { 
        name: "A-test", 
        lang: "en",
        fileType: "dataset",
        type: "spell",
        namespace: "bpds"
      }

      const problem = {
        name: "bpds A spelling",
        type: "spell",
        trainSet: [await bitfan.datasets.readDataset(trainFileDef)],
        testSet: await bitfan.datasets.readDataset(testFileDef),
        lang: "en",
      }

      const results = await bitfan.runSolution({
        name: "bpds spelling",
        problems: [problem],
        engine,
      }, [42]);

      const performanceReport = bitfan.evaluateMetrics(results, metrics);
      await bitfan.visualisation.showPerformanceReport(performanceReport);
  
      return performanceReport
    },

    evaluatePerformance: function(currentPerformance, previousPerformance) {
      const toleranceByMetric = {
        [bitfan.metrics.accuracy.name]: 0.02
      }
      return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
    }
  }
}
