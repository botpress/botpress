const makeProblem = (bitfan) => (topic) => {
  return {
    name: `bpds slot ${topic}`,
    type: "slot",
    trainSet: bitfan.datasets.bpds.slots.train[topic],
    testSet: bitfan.datasets.bpds.slots.test[topic],
    lang: "en",
  };
};

export default async function sloty(bitfan) {

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

  const metrics = [
    bitfan.metrics.slotScore,
    bitfan.metrics.slotBinaryScore,
    bitfan.metrics.slotCount,
  ];

  const problems = allTopics.map(makeProblem);

  const stanEndpoint = "http://localhost:3200";
  const password = "123456";
  const engine = new bitfan.engines.BpSlotEngine(stanEndpoint, password);

  const solution = {
    name: "bpds regression",
    problems,
    engine,
    metrics,
  };

  const seeds = [42, 69, 666];
  const results = await bitfan.runSolution(solution, seeds);

  const visMetrics = bitfan.visualisation.showAverageScoreByMetric(metrics);
  visMetrics(results);

  const visMetricsByProblem = bitfan.visualisation.showAverageScoreByMetric(
    metrics,
    { aggregateBy: "problem" }
  );
  visMetricsByProblem(results);

  bitfan.visualisation.showSlotsResults(results);
}
