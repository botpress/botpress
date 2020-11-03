const problemMaker = (bitfan) => (topic) => {
  return {
    name: `bpds intents ${topic}`,
    type: "intent",
    trainSet: bitfan.datasets.bpds.intents.train[topic],
    testSet: bitfan.datasets.bpds.intents.test[topic],
    lang: "en",
  };
};


const test = {
  name: "bpds-intent",
  fn: async function(bitfan) {
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

    const metrics = [
      bitfan.metrics.averageScore(bitfan.criterias.labelIs),
      bitfan.metrics.oosAccuracy,
      bitfan.metrics.oosPrecision,
      bitfan.metrics.oosRecall,
      bitfan.metrics.oosF1,
    ];

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

    return bitfan.evaluateMetrics(results, [bitfan.metrics.averageScore(bitfan.criterias.labelIs)], { groupBy: "seed" });
  }
}
module.exports = test