const core = require('@actions/core')
const github = require('@actions/github')

const titleRE = /^(chore|feat|fix|revert|test)(\(\w+\)?((?=:\s)|(?=!:\s)))?!?:\s.+/

async function run() {
  try {
    console.log(process.env.ctx)
    const pull_request = github.context.payload.pull_request

    if (!titleRE.test(pull_request.title)) {
      core.setFailed(
        'Title should be a conventionnal commit. Please refer to specification: https://www.conventionalcommits.org/en/v1.0.0/'
      )
    }
    if (!pull_request.body.toString().trim()) {
      core.setFailed(
        'Please set a proper description to your Pull Request. Describe why, how and what. Those are mandatory for the review process.'
      )
    }
    if (!pull_request.requested_reviewers.length) {
      core.setFailed('Request at least one reviewer on your Pull Request')
    }
    if (title.includes('feat')) {
      const token = process.env.token
      const octokit = github.getOctokit(token)
      const options = {
        ...github.context.repo,
        pull_number: github.context.payload.pull_request.number,
        per_page: 300
      }

      const files = await octokit.pulls.listFiles(options)
      core.info(`${files} mofified files in this PR`)

      const hasTests = !files.data.some(f => f.filename.includes('.test.'))
      if (!hasTests) {
        core.setFailed(
          `New features require new tests, please write e2e tests.\nThis eases review process and makes sure we don't introduce regressions in the long run.`
        )
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
