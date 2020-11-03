const path = require("path")
const fse = require("fs-extra")
const _ = require("lodash")

const makeResultsFileName = (testName) => {
  const fileName = `${testName}.json`
  return path.join(__dirname, "current_scores", fileName)
}

const updateResults = async (testName, results) => {
  const file = makeResultsFileName(testName)
  const content = JSON.stringify(results, undefined, 2)
  await fse.writeFile(file, content)
}

const readResults = async (testName) => {
  const file = makeResultsFileName(testName)
  const content = await fse.readFile(file)
  return JSON.parse(content)
}

const compareResults = (currentResults, previousResults, delta) => {
  const currentMetrics = Object.keys(currentResults).sort()
  const previousMetrics = Object.keys(previousResults).sort()
  if (!_.isEqual(currentMetrics, previousMetrics)) {
    throw new Error("Metrics seems to have change since last time results where updated." +
                    "Please update results before comparing.")
  }

  for (const metric of currentMetrics) {
    const currentGroups = Object.keys(currentResults[metric]).sort()
    const previousGroups = Object.keys(previousResults[metric]).sort()
    if (!_.isEqual(currentGroups, previousGroups)) {
      throw new Error("You're trying to compare results on different seeds or problems."+
                      "Please update results before comparing.")
    }

    for (const group of currentGroups) {
      const currentScore = currentResults[metric][group]
      const previousScore = previousResults[metric][group]

      const allowedDelta = delta * previousScore
      if (currentScore + allowedDelta < previousScore) {
        return { success: false, reason: JSON.stringify({ metric, group, currentScore, previousScore }, undefined, 2) }
      }
    }
  }

  return { success: true }
}

module.exports = {
  readResults,
  updateResults,
  compareResults
}