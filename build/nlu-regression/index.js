const bitfan = require("@botpress/bitfan").default
const chalk = require("chalk")

const bpdsIntents = require("./tests/bpds-intents")
const bpdsSlots = require("./tests/bpds-slots")

const { updateResults, readResults } = require("./score-service")

function formatReason(groupedBy, reason) {
  const prefix = groupedBy === "seed" ? "for seed" 
                : groupedBy === "problem" ? "for problem" 
                : "for"

  const { group, metric, currentScore, previousScore, allowedRegression } = reason

  return ` - ${prefix} "${group}", for metric "${metric}",\n`+ 
         `   current score is ${currentScore}, while previous score is ${previousScore} (allowed regression is ${allowedRegression}).`
}

function formatRegressionMessage(testName, comparison, groupedBy) {
  const makeReasonMsg = (r) => formatReason(groupedBy, r)
  const formattedReasons = comparison.reasons.map(makeReasonMsg)

  if (comparison.status === "regression") {
    return `There seems to be a regression on test ${testName}.\n` +
            'Reasons are:\n' +
            `${formattedReasons.join("\n")}`
  }
  if (comparison.status === "tolerated-regression") {
    return `There seems to be a regression on test ${testName}, but regression is small enough to be tolerated.\n` +
            "Reasons are:\n" +
            `${formattedReasons.join("\n")}`
  }
  return `No regression noted for test ${testName}.`
}

async function runTest(test, { update, keepGoing }) {
  const { name, computePerformance, evaluatePerformance } = test(bitfan)
  const performance = await computePerformance() 

  if (update) {
    await updateResults(name, performance)
    return true
  }

  const previousPerformance = await readResults(name)
  const comparison = evaluatePerformance(performance, previousPerformance)

  const regressionMessage = `\n${formatRegressionMessage(name, comparison, performance.groupedBy)}\n`
  if (comparison.status === "regression") {
    if (!keepGoing) {
      throw new Error(regressionMessage)
    }
    console.log(chalk.red(regressionMessage))
    console.log(chalk.gray("Skipping to next test...\n"))
    return false
  } 
  
  if (comparison.status !== "success") {
    console.log(chalk.yellow(regressionMessage))
    return true
  }
  
  console.log(chalk.green(regressionMessage))
  return true
}

async function main(args) {
  const update = args.includes("--update") || args.includes("-u")
  const keepGoing = args.includes("--keep-going") || args.includes("-k")

  const tests = [bpdsIntents, bpdsSlots]

  let testsPass = true
  for (const test of tests) {
    const currentTestPass = await runTest(test, { update, keepGoing })
    testsPass = testsPass && currentTestPass
  }

  if (update) {
    console.log(chalk.green("Test results where update with success."))
    return
  }
  
  if (!testsPass) {
    throw new Error("There was a regression in at least one test.")
  }
}

main(process.argv.slice(2))
  .then(() => {})
  .catch(err => {
    console.error(chalk.red("The following error occured:\n"), err)
    process.exit(1)
  })
