const bitfan = require('@botpress/bitfan').default

const problemMaker = bitfan => async (name, lang, trainSet, testSet, namespace) => {
  const fileDef = {
    lang,
    fileType: 'dataset',
    type: 'intent',
    namespace
  }

  const trainFileDef = { name: trainSet, ...fileDef }
  const testFileDef = { name: testSet, ...fileDef }

  return {
    name,
    type: 'intent',
    trainSet: await bitfan.datasets.readDataset(trainFileDef),
    testSet: await bitfan.datasets.readDataset(testFileDef),
    lang
  }
}

const metrics = [
  bitfan.metrics.accuracy,
  bitfan.metrics.oosAccuracy,
  bitfan.metrics.oosPrecision,
  bitfan.metrics.oosRecall,
  bitfan.metrics.oosF1
]

const bpds = {
  computePerformance: async function() {
    const makeProblem = problemMaker(bitfan)
    const problems = [
      await makeProblem('bpsd A-en', 'en', 'A-train', 'A-test', 'bpds'),
      await makeProblem('bpds A imbalanced-en', 'en', 'A-imbalanced-train', 'A-test', 'bpds'),
      await makeProblem('bpds A fewshot-en', 'en', 'A-fewshot-train', 'A-test', 'bpds'),
      await makeProblem('bpds B', 'en', 'B-train', 'B-test', 'bpds'),
      await makeProblem('bpsd A-fr', 'fr', 'A-train', 'A-test', 'bpds'),
      await makeProblem('bpds A imbalanced-fr', 'fr', 'A-imbalanced-train', 'A-test', 'bpds'),
      await makeProblem('bpds A fewshot-fr', 'fr', 'A-fewshot-train', 'A-test', 'bpds')
    ]

    const stanEndpoint = 'http://localhost:3200'
    const password = '123456'
    const engine = bitfan.engines.makeBpIntentEngine(stanEndpoint, password)

    const solution = {
      name: 'bpds intent',
      problems,
      engine
    }

    const seeds = [42, 69, 666]
    const results = await bitfan.runSolution(solution, seeds)

    const performanceReport = bitfan.evaluateMetrics(results, metrics)

    await bitfan.visualisation.showPerformanceReport(performanceReport, { groupBy: 'seed' })
    await bitfan.visualisation.showPerformanceReport(performanceReport, { groupBy: 'problem' })
    await bitfan.visualisation.showOOSConfusion(results)

    return performanceReport
  },

  evaluatePerformance: function(currentPerformance, previousPerformance) {
    const toleranceByMetric = {
      [bitfan.metrics.accuracy.name]: 0.03,
      [bitfan.metrics.oosAccuracy.name]: 0.05,
      [bitfan.metrics.oosPrecision.name]: 0.075,
      [bitfan.metrics.oosRecall.name]: 0.075,
      [bitfan.metrics.oosF1.name]: 0.15 // more tolerance for f1 score
    }
    return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
  }
}

const clinc150 = {
  computePerformance: async function() {
    const stanEndpoint = 'http://localhost:3200'
    const password = '123456'
    const engine = bitfan.engines.makeBpIntentEngine(stanEndpoint, password)

    const makeProblem = problemMaker(bitfan)

    const results = await bitfan.runSolution(
      {
        name: 'bpds intent',
        problems: [
          await makeProblem('clinc150, 20 utt/intent, seed 42', 'en', 'clinc150_20_42-train', 'clinc150_100-test', '')
        ],
        engine
      },
      [42]
    )

    const performanceReport = bitfan.evaluateMetrics(results, metrics)
    await bitfan.visualisation.showPerformanceReport(performanceReport, { groupBy: 'problem' })
    await bitfan.visualisation.showOOSConfusion(results)

    return performanceReport
  },

  evaluatePerformance: function(currentPerformance, previousPerformance) {
    const toleranceByMetric = {
      [bitfan.metrics.accuracy.name]: 0.05,
      [bitfan.metrics.oosAccuracy.name]: 0.05,
      [bitfan.metrics.oosPrecision.name]: 0.1,
      [bitfan.metrics.oosRecall.name]: 0.1,
      [bitfan.metrics.oosF1.name]: 0.15 // more tolerance for f1 score
    }
    return bitfan.comparePerformances(currentPerformance, previousPerformance, { toleranceByMetric })
  }
}

module.exports = {
  bpds,
  clinc150
}
