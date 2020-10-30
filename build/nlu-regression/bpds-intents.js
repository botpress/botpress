const problemMaker = (bitfan) => (topic) => {
  return {
    name: `bpds intents ${topic}`,
    type: "intent",
    trainSet: bitfan.datasets.bpds.intents.train[topic],
    testSet: bitfan.datasets.bpds.intents.test[topic],
    lang: "en",
  };
};

export default async function testy(bitfan) {
  const allTopics = ["A", "B", "C", "D", "E", "F"];

  const metrics = [
    bitfan.metrics.mostConfidentBinaryScore,
    bitfan.metrics.oosBinaryScore,
  ];

  const makeProblem = problemMaker(bitfan)
  const problems = allTopics.map(makeProblem);

  const stanEndpoint = "http://localhost:3200";
  const password = "123456";
  const engine = new bitfan.engines.BpIntentEngine(stanEndpoint, password);

  const solution = {
    name: "bpds regression",
    problems,
    engine,
    metrics,
  };

  const seeds = [42, 69, 666];
  const results = await bitfan.runSolution(solution, seeds);

  // visualise results

  const visMetricsByProblem = bitfan.visualisation.showAverageScoreByMetric(
    metrics,
    { aggregateBy: "problem" }
  );
  visMetricsByProblem(results);

  const visMetricsBySeed = bitfan.visualisation.showAverageScoreByMetric(
    metrics,
    { aggregateBy: "seed" }
  );
  visMetricsBySeed(results);

  bitfan.visualisation.showOOSConfusion(results);
}