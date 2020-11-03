const problemMaker = (bitfan) => (topic) => {
  return {
    name: `bpds slot ${topic}`,
    type: "slot",
    trainSet: bitfan.datasets.bpds.slots.train[topic],
    testSet: bitfan.datasets.bpds.slots.test[topic],
    lang: "en",
  };
};

module.exports = async function sloty(bitfan) {
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

  const criterias = [
    bitfan.criterias.slotsAre,
    bitfan.criterias.slotIncludes,
    bitfan.criterias.slotCountIs,
  ];

  const metrics = criterias.map(bitfan.metrics.averageScore);

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

  const report = bitfan.makeReport(results, metrics);
  bitfan.visualisation.showReport(report);
  bitfan.visualisation.showSlotsResults(results);

  console.log(report)
}
