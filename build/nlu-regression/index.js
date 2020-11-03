const bitfan = require("@botpress/bitfan").default
const chalk = require("chalk")

const bpdsIntents = require("./tests/bpds-intents")
const bpdsSlots = require("./tests/bpds-slots")

const { updateResults, readResults, compareResults } = require("./score-service")

const ALLOWED_REGRESSION = 0.05

async function runTest(test, args) {
  const { update, keepGoing } = args

  const results = await test.fn(bitfan)
    
  if (update) {
    await updateResults(test.name, results)
    return true
  }

  const previousResults = await readResults(test.name)
  const { success, reason } = compareResults(results, previousResults, ALLOWED_REGRESSION)

  console.log("")
  if (!success) {
    const msg = `There was a regression while running test: ${test.name}.\nReason is: ${reason}.`
    if (!keepGoing) {
      throw new Error(msg)
    }

    console.error(chalk.yellow(`${msg}`))
    console.error("Skipping to next test...\n")
    return false
  } 
  
  if (reason) {
    const msg = `There was a regression while running test: ${test.name} but it's under ${delta * 100}% so it's tolerated.
                \nReason is: ${reason}.\n`
    console.log(chalk.yellow(msg))
    return true
  }

  const msg = `No regression noted.\n`
  console.log(chalk.green(msg))
  return true
}

async function main(args) {
  const update = args.includes("--update") || args.includes("-u")
  const keepGoing = args.includes("--keep-going") || args.includes("-k")

  const tests = [bpdsIntents, bpdsSlots]

  let testPass = true
  for (const test of tests) {
    const currentTestPass = await runTest(test, { update, keepGoing }) 
    testPass = testPass && currentTestPass
  }

  if (!update && !testPass) {
    throw new Error("There was a regression in at least one test.")
  }

  if (update) {
    console.log(chalk.green("Test results where update with success."))
  }
}

main(process.argv.slice(2))
  .then(() => {})
  .catch(err => {
    console.error(chalk.red("\nThe following error occured:\n"), err)
    process.exit(1)
  })
