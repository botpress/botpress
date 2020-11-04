const path = require("path")
const fse = require("fs-extra")

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

module.exports = {
  readResults,
  updateResults
}
