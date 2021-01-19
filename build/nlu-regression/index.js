const bitfan = require('@botpress/bitfan').default
const chalk = require('chalk')
const readdir = require('recursive-readdir')
const yargs = require('yargs')

const { updateResults, readResults } = require('./score-service')

const TEST_FILE_EXT = '.nlu.test.js'

async function runTest(test, { update, keepGoing }) {
  const { name, computePerformance, evaluatePerformance } = test(bitfan)
  const performance = await computePerformance()

  if (update) {
    await updateResults(name, performance)
    return true
  }

  const previousPerformance = await readResults(name)
  const comparison = await evaluatePerformance(performance, previousPerformance)

  bitfan.visualisation.showComparisonReport(name, comparison)
  console.log('')

  if (comparison.status === 'regression') {
    if (!keepGoing) {
      throw new Error('Regression')
    }
    console.log(chalk.gray('Skipping to next test...\n'))
    return false
  }

  if (comparison.status !== 'success') {
    return true
  }

  return true
}

async function listTests(srcPath) {
  const files = await readdir(srcPath)
  return files.filter(f => f.endsWith(TEST_FILE_EXT)).map(f => require(f).default)
}

async function main(args) {
  const { update, keepGoing, srcPath } = args

  const tests = await listTests(srcPath)

  let testsPass = true
  for (const test of tests) {
    const currentTestPass = await runTest(test, { update, keepGoing })
    testsPass = testsPass && currentTestPass
  }

  if (update) {
    console.log(chalk.green('Test results where update with success.'))
    return
  }

  if (!testsPass) {
    throw new Error('There was a regression in at least one test.')
  }
}

yargs
  .command(
    ['test', '$0'],
    'run nlu regression tests',
    {
      update: {
        description: 'Weither or not to update previous results',
        alias: 'u',
        type: 'boolean'
      },
      keepGoing: {
        description: "Which problem to keep running tests when there's a regression",
        alias: 'k',
        type: 'boolean'
      },
      srcPath: {
        description: 'Path where to find test files',
        type: 'string',
        default: `${__dirname}/../../out/bp`
      }
    },
    argv => {
      main(argv)
        .then(() => console.log('Done.'))
        .catch(err => console.log(err))
    }
  )
  .help().argv
